// EnergyMeteringApp.Server/Models/ReportRequest.cs
public class ReportRequest
{
    public string Title { get; set; } = "Energy Consumption Report";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int ClassificationId { get; set; }
    public string CompanyName { get; set; } = "Your Company";
    public string PreparedBy { get; set; } = "Energy Management System";
    public bool IncludeCharts { get; set; } = true;
    public bool IncludeEnPI { get; set; } = true;
    public bool IncludeRawData { get; set; } = false;
}