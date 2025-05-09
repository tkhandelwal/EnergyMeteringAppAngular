using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace EnergyMeteringApp.Services
{
    public class DocumentationService
    {
        private readonly ApplicationDbContext _context;
        private readonly MeteringService _meteringService;
        private readonly EnPIService _enpiService;
        private readonly ILogger<DocumentationService> _logger;

        public DocumentationService(
            ApplicationDbContext context,
            MeteringService meteringService,
            EnPIService enpiService,
            ILogger<DocumentationService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _meteringService = meteringService ?? throw new ArgumentNullException(nameof(meteringService));
            _enpiService = enpiService ?? throw new ArgumentNullException(nameof(enpiService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<DocumentationResult> GenerateDocumentAsync(DocumentationRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            _logger.LogInformation($"Generating document of type: {request.DocumentType}");

            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.DocumentType))
                {
                    throw new ArgumentException("Document type is required");
                }

                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    request.Title = $"{request.DocumentType} - {DateTime.UtcNow:yyyy-MM-dd}";
                }

                if (request.StartDate >= request.EndDate)
                {
                    throw new ArgumentException("Start date must be before end date");
                }

                string content;
                switch (request.DocumentType.ToLowerInvariant())
                {
                    case "energypolicy":
                        content = await GenerateEnergyPolicyAsync();
                        break;
                    case "energyreview":
                        content = await GenerateEnergyReviewAsync(request.StartDate, request.EndDate);
                        break;
                    case "energybaseline":
                        content = await GenerateEnergyBaselineAsync(request.StartDate, request.EndDate);
                        break;
                    case "enpireport":
                        content = await GenerateEnPIReportAsync(request.StartDate, request.EndDate);
                        break;
                    case "actionplan":
                        content = await GenerateActionPlanAsync();
                        break;
                    case "compliancereport":
                        content = await GenerateComplianceReportAsync();
                        break;
                    default:
                        throw new ArgumentException($"Unsupported document type: {request.DocumentType}");
                }

                // Create a unique file identifier
                string fileId = Guid.NewGuid().ToString();
                string format = string.IsNullOrWhiteSpace(request.Format) ? "pdf" : request.Format.ToLowerInvariant();

                // In a real implementation, you would generate the actual document and save it
                // For this example, we'll just return a mock result
                var result = new DocumentationResult
                {
                    Title = request.Title,
                    DocumentType = request.DocumentType,
                    Format = format,
                    ContentUrl = $"/api/documentation/download/{fileId}.{format}",
                    GeneratedAt = DateTime.UtcNow
                };

                _logger.LogInformation($"Document generated successfully: {result.ContentUrl}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating document of type: {request.DocumentType}");
                throw;
            }
        }

        private async Task<string> GenerateEnergyPolicyAsync()
        {
            try
            {
                // In a real implementation, this might load template data from a database
                // or fetch policy content from another service
                await Task.Delay(100); // Simulate async operation

                StringBuilder content = new StringBuilder();
                content.AppendLine("ENERGY POLICY");
                content.AppendLine("==============");
                content.AppendLine();
                content.AppendLine("Our organization is committed to improving energy performance through the implementation of an Energy Management System (EnMS) in compliance with ISO 50001.");
                content.AppendLine();
                content.AppendLine("COMMITMENTS:");
                content.AppendLine();
                content.AppendLine("1. Continual improvement in energy performance");
                content.AppendLine("2. Ensuring the availability of information and resources to achieve energy objectives and targets");
                content.AppendLine("3. Complying with applicable legal and other requirements related to energy use");
                content.AppendLine("4. Supporting the procurement of energy-efficient products and services");
                content.AppendLine("5. Designing for energy performance improvement");
                content.AppendLine();
                content.AppendLine("This energy policy provides a framework for setting and reviewing energy objectives and targets.");
                content.AppendLine();
                content.AppendLine("SCOPE:");
                content.AppendLine();
                content.AppendLine("This policy applies to all operations and facilities under our direct control.");
                content.AppendLine();
                content.AppendLine($"Date: {DateTime.UtcNow:yyyy-MM-dd}");
                content.AppendLine("Approved by: [Management Representative]");

                return content.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating energy policy");
                throw;
            }
        }

        private async Task<string> GenerateEnergyReviewAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                // Get energy data for the period
                var meteringData = await _meteringService.GetMeteringDataAsync(startDate, endDate);
                var classifications = await _context.Classifications.ToListAsync();

                if (meteringData == null || !meteringData.Any())
                {
                    return $"ENERGY REVIEW\n\nPeriod: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}\n\nNo metering data available for the selected period.";
                }

                // Generate the review content
                StringBuilder content = new StringBuilder();
                content.AppendLine("ENERGY REVIEW");
                content.AppendLine("==============");
                content.AppendLine();
                content.AppendLine($"Period: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");
                content.AppendLine();

                // Add basic stats
                double totalEnergy = meteringData.Sum(d => d.EnergyValue);
                double maxPower = meteringData.Max(d => d.Power);
                double avgPower = meteringData.Average(d => d.Power);

                content.AppendLine($"Total Energy Consumption: {totalEnergy:N0} kWh");
                content.AppendLine($"Maximum Power Demand: {maxPower:N0} kW");
                content.AppendLine($"Average Power Demand: {avgPower:N0} kW");
                content.AppendLine();

                // Add data by classification
                content.AppendLine("Energy Consumption by Classification:");

                // Group energy by classification
                var energyByClass = meteringData
                    .GroupBy(d => d.ClassificationId)
                    .Select(g => new
                    {
                        ClassificationId = g.Key,
                        TotalEnergy = g.Sum(d => d.EnergyValue),
                        MaxPower = g.Max(d => d.Power)
                    })
                    .ToList();

                foreach (var item in energyByClass.OrderByDescending(c => c.TotalEnergy))
                {
                    if (item.ClassificationId.HasValue)
                    {
                        var classification = classifications.FirstOrDefault(c => c.Id == item.ClassificationId.Value);
                        if (classification != null)
                        {
                            content.AppendLine($"- {classification.Name}: {item.TotalEnergy:N0} kWh, Max Power: {item.MaxPower:N0} kW");
                        }
                    }
                }

                content.AppendLine();
                content.AppendLine("SIGNIFICANT ENERGY USES (SEUs):");
                content.AppendLine();

                // Identify top 3 consumers as SEUs
                var seus = energyByClass
                    .OrderByDescending(c => c.TotalEnergy)
                    .Take(3)
                    .ToList();

                foreach (var seu in seus)
                {
                    if (seu.ClassificationId.HasValue)
                    {
                        var classification = classifications.FirstOrDefault(c => c.Id == seu.ClassificationId.Value);
                        if (classification != null)
                        {
                            double percentage = (seu.TotalEnergy / totalEnergy) * 100;
                            content.AppendLine($"- {classification.Name}: {seu.TotalEnergy:N0} kWh ({percentage:N1}% of total energy)");
                        }
                    }
                }

                content.AppendLine();
                content.AppendLine("RECOMMENDATIONS:");
                content.AppendLine();
                content.AppendLine("1. Establish energy baselines for the significant energy uses");
                content.AppendLine("2. Define EnPIs to monitor energy performance");
                content.AppendLine("3. Set energy reduction targets based on the findings");
                content.AppendLine("4. Develop action plans to improve energy performance");

                return content.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating energy review");
                throw;
            }
        }

        private async Task<string> GenerateEnergyBaselineAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                var meteringData = await _meteringService.GetMeteringDataAsync(startDate, endDate);
                var classifications = await _context.Classifications.ToListAsync();

                if (meteringData == null || !meteringData.Any())
                {
                    return $"ENERGY BASELINE\n\nBaseline Period: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}\n\nNo metering data available for the selected period.";
                }

                // Generate content
                StringBuilder content = new StringBuilder();
                content.AppendLine("ENERGY BASELINE");
                content.AppendLine("===============");
                content.AppendLine();
                content.AppendLine($"Baseline Period: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");
                content.AppendLine();

                // Extract data by classification
                var dataByClass = meteringData
                    .GroupBy(d => d.ClassificationId)
                    .Select(g => new
                    {
                        ClassificationId = g.Key,
                        TotalEnergy = g.Sum(d => d.EnergyValue),
                        MaxPower = g.Max(d => d.Power),
                        AvgPower = g.Average(d => d.Power),
                        Readings = g.Count()
                    })
                    .ToList();

                // Calculate baseline values
                content.AppendLine("BASELINE ENERGY CONSUMPTION:");
                content.AppendLine();

                foreach (var item in dataByClass.OrderByDescending(c => c.TotalEnergy))
                {
                    if (item.ClassificationId.HasValue)
                    {
                        var classification = classifications.FirstOrDefault(c => c.Id == item.ClassificationId.Value);
                        if (classification != null)
                        {
                            content.AppendLine($"- {classification.Name}:");
                            content.AppendLine($"  Total Energy: {item.TotalEnergy:N0} kWh");
                            content.AppendLine($"  Maximum Power: {item.MaxPower:N0} kW");
                            content.AppendLine($"  Average Power: {item.AvgPower:N0} kW");
                            content.AppendLine($"  Number of Readings: {item.Readings}");
                            content.AppendLine();
                        }
                    }
                }

                // Add relevant variables
                content.AppendLine("RELEVANT VARIABLES:");
                content.AppendLine();
                content.AppendLine("The following variables affect energy consumption and have been considered in the baseline:");
                content.AppendLine("1. Production volume");
                content.AppendLine("2. Heating and cooling degree days");
                content.AppendLine("3. Occupancy");
                content.AppendLine();

                // Add normalization factors
                content.AppendLine("NORMALIZATION FACTORS:");
                content.AppendLine();
                content.AppendLine("To account for variations in production and weather, the following normalization factors can be applied:");
                content.AppendLine("1. Production: kWh per unit produced");
                content.AppendLine("2. Weather: kWh per degree day");
                content.AppendLine();

                // Add adjustment criteria
                content.AppendLine("BASELINE ADJUSTMENT CRITERIA:");
                content.AppendLine();
                content.AppendLine("The baseline will be adjusted under the following circumstances:");
                content.AppendLine("1. Major changes in processes, operations, or facilities");
                content.AppendLine("2. Discovery of errors in baseline data");
                content.AppendLine("3. Changes in primary energy sources");
                content.AppendLine("4. Significant changes in relevant variables");
                content.AppendLine();

                content.AppendLine("This baseline will be used to evaluate energy performance improvements and to set realistic energy objectives and targets.");

                return content.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating energy baseline");
                throw;
            }
        }

        private async Task<string> GenerateEnPIReportAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                // Get EnPIs within the date range (using calculation date)
                var enpis = await _context.EnPIs
                    .Include(e => e.Classification)
                    .Where(e => e.CalculationDate >= startDate && e.CalculationDate <= endDate)
                    .ToListAsync();

                // Get EnPI definitions and targets for context
                var enpiDefinitions = await _context.EnPIDefinitions
                    .Include(e => e.Classification)
                    .Include(e => e.Targets)
                    .ToListAsync();

                StringBuilder content = new StringBuilder();
                content.AppendLine("ENERGY PERFORMANCE INDICATORS (EnPI) REPORT");
                content.AppendLine("===========================================");
                content.AppendLine();
                content.AppendLine($"Period: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");
                content.AppendLine();

                // Add report content
                if (enpis != null && enpis.Any())
                {
                    content.AppendLine("EnPI PERFORMANCE:");
                    content.AppendLine();

                    foreach (var enpi in enpis.OrderBy(e => e.Name))
                    {
                        content.AppendLine($"- {enpi.Name} ({enpi.Classification?.Name ?? "Unknown"}):");
                        content.AppendLine($"  Formula: {enpi.Formula}");
                        content.AppendLine($"  Baseline Value: {enpi.BaselineValue:N2}");
                        content.AppendLine($"  Current Value: {enpi.CurrentValue:N2}");
                        content.AppendLine($"  Calculation Date: {enpi.CalculationDate:yyyy-MM-dd}");

                        if (enpi.BaselineValue > 0)
                        {
                            double improvement = (enpi.BaselineValue - enpi.CurrentValue) / enpi.BaselineValue * 100;
                            content.AppendLine($"  Improvement: {improvement:N2}%");
                        }

                        // Find targets for this EnPI's classification
                        var relatedTargets = _context.Targets
                            .Include(t => t.EnPIDefinition)
                            .Where(t => t.EnPIDefinition != null &&
                                    t.EnPIDefinition.ClassificationId == enpi.ClassificationId)
                            .ToList();

                        if (relatedTargets != null && relatedTargets.Any())
                        {
                            content.AppendLine();
                            content.AppendLine("  Related Targets:");
                            foreach (var target in relatedTargets.OrderByDescending(t => t.TargetDate))
                            {
                                content.AppendLine($"  - {target.EnPIDefinition?.Name ?? "Unknown"}: {target.TargetValue} {(target.TargetType == "Reduction" ? "% reduction" : "")} by {target.TargetDate:yyyy-MM-dd}");
                            }
                        }

                        content.AppendLine();
                    }

                    // Add trend analysis
                    content.AppendLine("TREND ANALYSIS:");
                    content.AppendLine();

                    // Group EnPIs by name to compare over time (for those with multiple entries)
                    var enpisByName = enpis.GroupBy(e => e.Name).Where(g => g.Count() > 1).ToList();

                    if (enpisByName.Any())
                    {
                        foreach (var group in enpisByName)
                        {
                            content.AppendLine($"- {group.Key} Trend:");

                            var orderedValues = group.OrderBy(e => e.CalculationDate).ToList();
                            var firstValue = orderedValues.First().CurrentValue;
                            var lastValue = orderedValues.Last().CurrentValue;

                            double change = firstValue > 0
                                ? (lastValue - firstValue) / firstValue * 100
                                : 0;

                            content.AppendLine($"  Change over period: {change:N2}%");
                            content.AppendLine();
                        }
                    }
                    else
                    {
                        content.AppendLine("Insufficient data for trend analysis. Multiple calculations over time are needed to establish trends.");
                        content.AppendLine();
                    }
                }
                else
                {
                    content.AppendLine("No EnPI data available for the selected period.");

                    // Suggest EnPI definitions that could be used
                    if (enpiDefinitions != null && enpiDefinitions.Any())
                    {
                        content.AppendLine();
                        content.AppendLine("AVAILABLE EnPI DEFINITIONS:");
                        content.AppendLine();

                        foreach (var def in enpiDefinitions)
                        {
                            content.AppendLine($"- {def.Name} ({def.Classification?.Name ?? "Unknown"})");
                            content.AppendLine($"  Formula Type: {def.FormulaType}");
                            if (def.NormalizeBy != "None")
                            {
                                content.AppendLine($"  Normalization: {def.NormalizeBy} ({def.NormalizationUnit ?? "Unknown"})");
                            }

                            // List targets for this definition
                            if (def.Targets != null && def.Targets.Any())
                            {
                                content.AppendLine("  Targets:");
                                foreach (var target in def.Targets.OrderByDescending(t => t.TargetDate))
                                {
                                    content.AppendLine($"  - {target.TargetValue} {(target.TargetType == "Reduction" ? "% reduction" : "")} by {target.TargetDate:yyyy-MM-dd}");
                                }
                            }

                            content.AppendLine();
                        }
                    }
                }

                // Add recommendations
                content.AppendLine("RECOMMENDATIONS:");
                content.AppendLine();
                content.AppendLine("1. Continue tracking EnPIs to monitor energy performance");
                content.AppendLine("2. Define additional EnPIs for key energy uses not currently covered");
                content.AppendLine("3. Set or update targets based on the EnPI results");
                content.AppendLine("4. Develop action plans to address areas of poor performance");

                return content.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating EnPI report");
                throw;
            }
        }

        private async Task<string> GenerateActionPlanAsync()
        {
            try
            {
                var actionPlans = await _context.ActionPlans
                    .Include(a => a.Classification)
                    .ToListAsync();

                StringBuilder content = new StringBuilder();
                content.AppendLine("ENERGY ACTION PLAN");
                content.AppendLine("=================");
                content.AppendLine();

                if (actionPlans != null && actionPlans.Any())
                {
                    // Summarize action plans by status
                    int planned = actionPlans.Count(p => p.Status == "Planned");
                    int inProgress = actionPlans.Count(p => p.Status == "InProgress");
                    int completed = actionPlans.Count(p => p.Status == "Completed");
                    int delayed = actionPlans.Count(p => p.Status == "Delayed");
                    int cancelled = actionPlans.Count(p => p.Status == "Cancelled");

                    content.AppendLine("SUMMARY:");
                    content.AppendLine();
                    content.AppendLine($"Total Action Plans: {actionPlans.Count}");
                    content.AppendLine($"Planned: {planned}");
                    content.AppendLine($"In Progress: {inProgress}");
                    content.AppendLine($"Completed: {completed}");
                    content.AppendLine($"Delayed: {delayed}");
                    content.AppendLine($"Cancelled: {cancelled}");
                    content.AppendLine();

                    // Calculate total energy savings and costs
                    double totalSavings = actionPlans.Sum(p => p.EnergySavingEstimate);
                    double totalCost = actionPlans.Sum(p => p.CostEstimate);
                    double completedSavings = actionPlans
                        .Where(p => p.Status == "Completed")
                        .Sum(p => p.EnergySavingEstimate);

                    content.AppendLine($"Total Estimated Energy Savings: {totalSavings:N0} kWh");
                    content.AppendLine($"Achieved Energy Savings: {completedSavings:N0} kWh");
                    content.AppendLine($"Total Estimated Cost: ${totalCost:N0}");
                    content.AppendLine();

                    content.AppendLine("ACTION ITEMS:");
                    content.AppendLine();

                    foreach (var plan in actionPlans.OrderBy(p => p.Status).ThenBy(p => p.StartDate))
                    {
                        content.AppendLine($"- {plan.Name} ({plan.Classification?.Name ?? "Unknown"}):");
                        content.AppendLine($"  Description: {plan.Description ?? "N/A"}");
                        content.AppendLine($"  Energy Saving Estimate: {plan.EnergySavingEstimate:N0} kWh");
                        content.AppendLine($"  Cost Estimate: ${plan.CostEstimate:N0}");
                        content.AppendLine($"  Timeline: {plan.StartDate:yyyy-MM-dd} to {plan.EndDate:yyyy-MM-dd}");
                        content.AppendLine($"  Status: {plan.Status}");
                        content.AppendLine($"  Responsible: {plan.Responsible ?? "N/A"}");
                        if (!string.IsNullOrWhiteSpace(plan.Notes))
                        {
                            content.AppendLine($"  Notes: {plan.Notes}");
                        }
                        content.AppendLine();
                    }
                }
                else
                {
                    content.AppendLine("No action plans have been defined yet.");
                    content.AppendLine();
                    content.AppendLine("RECOMMENDATIONS:");
                    content.AppendLine();
                    content.AppendLine("1. Identify opportunities for energy performance improvement");
                    content.AppendLine("2. Define action plans with clear objectives, timelines, and responsibilities");
                    content.AppendLine("3. Estimate energy savings and costs for each action plan");
                    content.AppendLine("4. Implement and monitor the action plans");
                    content.AppendLine("5. Review and update the action plans regularly");
                }

                return content.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating action plan report");
                throw;
            }
        }

        private async Task<string> GenerateComplianceReportAsync()
        {
            try
            {
                // Check for existence of key elements for compliance
                bool hasBaselines = await _context.Baselines.AnyAsync();
                bool hasEnPIs = await _context.EnPIs.AnyAsync();
                bool hasEnPIDefinitions = await _context.EnPIDefinitions.AnyAsync();
                bool hasTargets = await _context.Targets.AnyAsync();
                bool hasActionPlans = await _context.ActionPlans.AnyAsync();

                StringBuilder content = new StringBuilder();
                content.AppendLine("ISO 50001 COMPLIANCE REPORT");
                content.AppendLine("==========================");
                content.AppendLine();
                content.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd}");
                content.AppendLine();

                // Add compliance status for each requirement
                content.AppendLine("COMPLIANCE STATUS:");
                content.AppendLine();
                content.AppendLine($"1. Energy Policy: {"Implemented"}");
                content.AppendLine($"2. Energy Review: {"Implemented"}");
                content.AppendLine($"3. Energy Baseline: {(hasBaselines ? "Implemented" : "Not Implemented")}");
                content.AppendLine($"4. Energy Performance Indicators: {(hasEnPIs || hasEnPIDefinitions ? "Implemented" : "Not Implemented")}");
                content.AppendLine($"5. Energy Objectives and Targets: {(hasTargets ? "Implemented" : "Not Implemented")}");
                content.AppendLine($"6. Action Plans: {(hasActionPlans ? "Implemented" : "Not Implemented")}");
                content.AppendLine($"7. Operational Control: {"Partial Implementation"}");
                content.AppendLine($"8. Monitoring and Measurement: {"Implemented"}");
                content.AppendLine($"9. Internal Audit: {"Not Implemented"}");
                content.AppendLine($"10. Management Review: {"Not Implemented"}");
                content.AppendLine();

                // Calculate overall compliance
                int implementedCount = 3; // Energy Policy, Energy Review, and Monitoring/Measurement are already implemented
                if (hasBaselines) implementedCount++;
                if (hasEnPIs || hasEnPIDefinitions) implementedCount++;
                if (hasTargets) implementedCount++;
                if (hasActionPlans) implementedCount++;

                double compliancePercentage = (double)implementedCount / 10 * 100;
                content.AppendLine($"Overall Compliance: {compliancePercentage:N0}%");
                content.AppendLine();

                // Add improvement recommendations
                content.AppendLine("IMPROVEMENT RECOMMENDATIONS:");
                content.AppendLine();

                if (!hasBaselines)
                {
                    content.AppendLine("- Establish energy baselines for significant energy uses");
                }

                if (!hasEnPIs && !hasEnPIDefinitions)
                {
                    content.AppendLine("- Define Energy Performance Indicators (EnPIs) to monitor energy performance");
                }

                if (!hasTargets)
                {
                    content.AppendLine("- Set energy objectives and targets based on EnPIs and baselines");
                }

                if (!hasActionPlans)
                {
                    content.AppendLine("- Develop action plans to achieve energy objectives and targets");
                }

                content.AppendLine("- Implement operational controls for significant energy uses");
                content.AppendLine("- Conduct internal audits of the EnMS");
                content.AppendLine("- Perform management reviews of the EnMS");
                content.AppendLine();

                content.AppendLine("NEXT STEPS:");
                content.AppendLine();
                content.AppendLine("1. Prioritize improvement actions based on compliance gaps");
                content.AppendLine("2. Assign responsibilities for each improvement action");
                content.AppendLine("3. Set deadlines for completing each action");
                content.AppendLine("4. Monitor and report progress regularly");
                content.AppendLine("5. Update this compliance report quarterly");

                return content.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating compliance report");
                throw;
            }
        }
    }
}