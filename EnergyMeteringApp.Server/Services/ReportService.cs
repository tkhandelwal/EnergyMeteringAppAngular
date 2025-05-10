// EnergyMeteringApp.Server/Services/ReportService.cs
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using System.IO;
using System.Drawing;

public class ReportService
{
    private readonly ApplicationDbContext _context;
    private readonly MeteringService _meteringService;
    private readonly IWebHostEnvironment _env;

    public ReportService(
        ApplicationDbContext context,
        MeteringService meteringService,
        IWebHostEnvironment env)
    {
        _context = context;
        _meteringService = meteringService;
        _env = env;
    }

    public async Task<string> GenerateWordReport(ReportRequest request)
    {
        // Create a unique filename
        string fileName = $"Energy_Report_{DateTime.Now:yyyyMMdd_HHmmss}.docx";
        string filePath = Path.Combine(_env.WebRootPath, "reports", fileName);

        // Ensure directory exists
        Directory.CreateDirectory(Path.GetDirectoryName(filePath));

        // Create the Word document
        using (WordprocessingDocument doc = WordprocessingDocument.Create(filePath, WordprocessingDocumentType.Document))
        {
            // Add a main document part
            MainDocumentPart mainPart = doc.AddMainDocumentPart();
            mainPart.Document = new Document();
            Body body = mainPart.Document.AppendChild(new Body());

            // Add title
            AddHeading(body, request.Title, 1);

            // Add date range
            string dateRange = $"Period: {request.StartDate:MMMM d, yyyy} to {request.EndDate:MMMM d, yyyy}";
            AddParagraph(body, dateRange);

            // Add company info
            AddHeading(body, "Company Information", 2);
            Table companyTable = CreateTable(body, 2);
            AddTableRow(companyTable, "Company Name:", request.CompanyName);
            AddTableRow(companyTable, "Report Generated:", DateTime.Now.ToString("MMMM d, yyyy"));
            AddTableRow(companyTable, "Prepared By:", request.PreparedBy);

            // Add executive summary
            AddHeading(body, "Executive Summary", 2);
            AddParagraph(body, "This report provides an analysis of energy consumption and performance for the specified period.");

            // Get actual data
            var meteringData = await _meteringService.GetMeteringDataAsync(
                request.StartDate,
                request.EndDate,
                request.ClassificationId);

            // Add consumption summary section
            await AddConsumptionSummary(body, meteringData, request);

            // Add EnPI section if requested
            if (request.IncludeEnPI)
                await AddEnPISection(body, request);

            // Add recommendations section
            AddRecommendationsSection(body, request);

            // Add appendix with raw data if requested
            if (request.IncludeRawData)
                AddRawDataSection(body, meteringData);

            // Save the document
            mainPart.Document.Save();
        }

        return $"/reports/{fileName}";
    }

    private void AddHeading(Body body, string text, int level)
    {
        Paragraph heading = body.AppendChild(new Paragraph());
        Run run = heading.AppendChild(new Run());
        RunProperties runProps = run.AppendChild(new RunProperties());

        // Set font size based on heading level
        int fontSize = level == 1 ? 36 : level == 2 ? 28 : 24;
        runProps.AppendChild(new FontSize { Val = fontSize.ToString() });
        runProps.AppendChild(new Bold());

        // Add text
        run.AppendChild(new Text(text));

        // Add spacing
        ParagraphProperties paragraphProps = heading.AppendChild(new ParagraphProperties());
        SpacingBetweenLines spacing = new SpacingBetweenLines { After = "400", Before = "400" };
        paragraphProps.AppendChild(spacing);
    }

    private void AddParagraph(Body body, string text)
    {
        Paragraph para = body.AppendChild(new Paragraph());
        Run run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
    }

    private Table CreateTable(Body body, int columns)
    {
        Table table = body.AppendChild(new Table());

        // Set table properties
        TableProperties tableProps = table.AppendChild(new TableProperties());
        TableWidth tableWidth = new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct };
        tableProps.AppendChild(tableWidth);

        TableBorders borders = new TableBorders(
            new TopBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new BottomBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new LeftBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new RightBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideHorizontalBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideVerticalBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 }
        );
        tableProps.AppendChild(borders);

        return table;
    }

    private void AddTableRow(Table table, string label, string value)
    {
        TableRow row = table.AppendChild(new TableRow());

        // Label cell
        TableCell labelCell = row.AppendChild(new TableCell());
        labelCell.AppendChild(new Paragraph(new Run(new Text(label))));

        // Value cell
        TableCell valueCell = row.AppendChild(new TableCell());
        valueCell.AppendChild(new Paragraph(new Run(new Text(value))));
    }

    private async Task AddConsumptionSummary(Body body, IEnumerable<MeteringData> data, ReportRequest request)
    {
        AddHeading(body, "Energy Consumption Summary", 2);

        if (data == null || !data.Any())
        {
            AddParagraph(body, "No data available for the selected period.");
            return;
        }

        double totalEnergy = data.Sum(d => d.EnergyValue);
        double maxPower = data.Max(d => d.Power);
        double avgPower = data.Average(d => d.Power);

        AddParagraph(body, $"Total energy consumption for the period was {totalEnergy:N2} kWh, with a maximum demand of {maxPower:N2} kW and an average demand of {avgPower:N2} kW.");

        // Add chart image if available
        if (request.IncludeCharts)
        {
            // Generate chart using external charting service/library
            string chartPath = await GenerateConsumptionChart(data, request);
            if (!string.IsNullOrEmpty(chartPath))
            {
                AddImage(body, chartPath, "Energy consumption over time");
            }
        }

        // Add consumption breakdown by classification
        var consumptionByClass = data
            .GroupBy(d => d.ClassificationId)
            .Select(g => new {
                ClassificationId = g.Key,
                Classification = g.First().Classification?.Name ?? "Unknown",
                TotalEnergy = g.Sum(d => d.EnergyValue),
                MaxPower = g.Max(d => d.Power)
            })
            .OrderByDescending(c => c.TotalEnergy)
            .ToList();

        if (consumptionByClass.Any())
        {
            AddHeading(body, "Consumption by Classification", 3);

            Table table = CreateTable(body, 3);

            // Header row
            TableRow headerRow = table.AppendChild(new TableRow());
            AddHeaderCell(headerRow, "Classification");
            AddHeaderCell(headerRow, "Energy (kWh)");
            AddHeaderCell(headerRow, "Max Power (kW)");

            // Data rows
            foreach (var item in consumptionByClass)
            {
                TableRow row = table.AppendChild(new TableRow());
                AddCell(row, item.Classification);
                AddCell(row, item.TotalEnergy.ToString("N2"));
                AddCell(row, item.MaxPower.ToString("N2"));
            }
        }
    }

    private void AddHeaderCell(TableRow row, string text)
    {
        TableCell cell = row.AppendChild(new TableCell());
        Paragraph p = cell.AppendChild(new Paragraph());
        Run r = p.AppendChild(new Run());
        RunProperties rp = r.AppendChild(new RunProperties());
        rp.AppendChild(new Bold());
        r.AppendChild(new Text(text));
    }

    private void AddCell(TableRow row, string text)
    {
        TableCell cell = row.AppendChild(new TableCell());
        cell.AppendChild(new Paragraph(new Run(new Text(text))));
    }

    private async Task<string> GenerateConsumptionChart(IEnumerable<MeteringData> data, ReportRequest request)
    {
        // This would use a charting library to generate a chart image
        // For this example, we'll assume it's implemented elsewhere
        return null;
    }

    private void AddImage(Body body, string imagePath, string description)
    {
        // Add image to document
        // Implementation details omitted for brevity
    }

    private async Task AddEnPISection(Body body, ReportRequest request)
    {
        AddHeading(body, "Energy Performance Indicators", 2);

        // Fetch EnPI data
        var enpis = await _context.EnPIs
            .Include(e => e.Classification)
            .Where(e => e.ClassificationId == request.ClassificationId)
            .ToListAsync();

        if (enpis == null || !enpis.Any())
        {
            AddParagraph(body, "No EnPI data available for the selected classification.");
            return;
        }

        Table table = CreateTable(body, 4);

        // Header row
        TableRow headerRow = table.AppendChild(new TableRow());
        AddHeaderCell(headerRow, "Indicator");
        AddHeaderCell(headerRow, "Baseline");
        AddHeaderCell(headerRow, "Current");
        AddHeaderCell(headerRow, "Improvement");

        // Data rows
        foreach (var enpi in enpis)
        {
            TableRow row = table.AppendChild(new TableRow());
            AddCell(row, enpi.Name);
            AddCell(row, enpi.BaselineValue.ToString("N2"));
            AddCell(row, enpi.CurrentValue.ToString("N2"));

            double improvement = 0;
            if (enpi.BaselineValue > 0)
            {
                improvement = ((enpi.BaselineValue - enpi.CurrentValue) / enpi.BaselineValue) * 100;
            }

            AddCell(row, $"{improvement:N2}%");
        }
    }

    private void AddRecommendationsSection(Body body, ReportRequest request)
    {
        AddHeading(body, "Recommendations", 2);

        // Sample recommendations - in a real system these could be generated based on data analysis
        AddParagraph(body, "Based on the analysis of energy consumption data, the following recommendations are provided:");

        Paragraph list = body.AppendChild(new Paragraph());
        ParagraphProperties pProps = list.AppendChild(new ParagraphProperties());
        pProps.AppendChild(new NumberingProperties(
            new NumberingLevelReference { Val = 0 },
            new NumberingId { Val = 1 }
        ));

        // Add recommendation items
        AddListItem(body, "Implement a scheduled equipment shutdown policy during non-operational hours to reduce standby power consumption.");
        AddListItem(body, "Investigate the high energy consumption in the Server Room area and consider virtualization or equipment consolidation.");
        AddListItem(body, "Upgrade lighting systems to LED technology with motion sensors in low-traffic areas.");
        AddListItem(body, "Develop a comprehensive energy management plan with specific reduction targets.");
    }

    private void AddListItem(Body body, string text)
    {
        Paragraph para = body.AppendChild(new Paragraph());
        ParagraphProperties pProps = para.AppendChild(new ParagraphProperties());
        pProps.AppendChild(new NumberingProperties(
            new NumberingLevelReference { Val = 0 },
            new NumberingId { Val = 1 }
        ));

        Run run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
    }

    private void AddRawDataSection(Body body, IEnumerable<MeteringData> data)
    {
        AddHeading(body, "Appendix: Raw Data", 2);

        if (data == null || !data.Any())
        {
            AddParagraph(body, "No data available for the selected period.");
            return;
        }

        // Limit to a reasonable number of rows
        var limitedData = data.OrderByDescending(d => d.Timestamp).Take(100).ToList();

        AddParagraph(body, $"Showing the most recent {limitedData.Count} data points from the selected period:");

        Table table = CreateTable(body, 4);

        // Header row
        TableRow headerRow = table.AppendChild(new TableRow());
        AddHeaderCell(headerRow, "Timestamp");
        AddHeaderCell(headerRow, "Classification");
        AddHeaderCell(headerRow, "Energy (kWh)");
        AddHeaderCell(headerRow, "Power (kW)");

        // Data rows
        foreach (var item in limitedData)
        {
            TableRow row = table.AppendChild(new TableRow());
            AddCell(row, item.Timestamp.ToString("yyyy-MM-dd HH:mm"));
            AddCell(row, item.Classification?.Name ?? "Unknown");
            AddCell(row, item.EnergyValue.ToString("N2"));
            AddCell(row, item.Power.ToString("N2"));
        }
    }
}