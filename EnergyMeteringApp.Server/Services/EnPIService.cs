using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Services
{
    public class EnPIService
    {
        private readonly ApplicationDbContext _context;
        private readonly MeteringService _meteringService;
        private readonly ILogger<EnPIService> _logger;

        public EnPIService(
            ApplicationDbContext context,
            MeteringService meteringService,
            ILogger<EnPIService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _meteringService = meteringService ?? throw new ArgumentNullException(nameof(meteringService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<EnPI> CalculateEnPIAsync(EnPICalculationRequest request)
        {
            try
            {
                if (request == null)
                {
                    throw new ArgumentNullException(nameof(request));
                }

                // Validate request
                var classification = await _context.Classifications.FindAsync(request.ClassificationId);
                if (classification == null)
                {
                    throw new ArgumentException($"Classification with ID {request.ClassificationId} not found");
                }

                // Get current period data
                var currentPeriodData = await _meteringService.GetMeteringDataAsync(
                    request.StartDate,
                    request.EndDate,
                    request.ClassificationId);

                if (currentPeriodData == null || !currentPeriodData.Any())
                {
                    throw new ArgumentException($"No data available for the selected period: {request.StartDate} to {request.EndDate}");
                }

                // Use default formula if none provided
                string formula = request.Formula ?? "TotalEnergy";

                // Calculate current value based on formula
                double currentValue = CalculateMetric(currentPeriodData, formula);

                // Calculate baseline value if requested
                double baselineValue = 0;
                if (request.BaselineStartDate.HasValue && request.BaselineEndDate.HasValue)
                {
                    var baselineData = await _meteringService.GetMeteringDataAsync(
                        request.BaselineStartDate.Value,
                        request.BaselineEndDate.Value,
                        request.ClassificationId);

                    if (baselineData != null && baselineData.Any())
                    {
                        baselineValue = CalculateMetric(baselineData, formula);
                    }
                    else
                    {
                        _logger.LogWarning($"No baseline data available for the period: {request.BaselineStartDate} to {request.BaselineEndDate}");
                    }
                }

                // Determine name if not provided
                string name = !string.IsNullOrWhiteSpace(request.Name)
                    ? request.Name
                    : $"{classification.Name} - {formula}";

                // Create and save the EnPI
                var enpi = new EnPI
                {
                    Name = name,
                    Formula = formula,
                    BaselineValue = baselineValue,
                    CurrentValue = currentValue,
                    CalculationDate = DateTime.UtcNow,
                    ClassificationId = request.ClassificationId
                };

                _context.EnPIs.Add(enpi);
                await _context.SaveChangesAsync();

                // Reload with related entities
                var savedEnpi = await _context.EnPIs
                    .Include(e => e.Classification)
                    .FirstOrDefaultAsync(e => e.Id == enpi.Id);

                return savedEnpi ?? enpi;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating EnPI");
                throw;
            }
        }

        private double CalculateMetric(IEnumerable<MeteringData> data, string? formula)
        {
            if (data == null || !data.Any())
            {
                return 0;
            }

            // Default to TotalEnergy if formula is null or empty
            if (string.IsNullOrWhiteSpace(formula))
            {
                return data.Sum(d => d.EnergyValue);
            }

            switch (formula)
            {
                case "TotalEnergy":
                    return data.Sum(d => d.EnergyValue);

                case "EnergyPerHour":
                    var timestamps = data.Select(d => d.Timestamp).OrderBy(t => t).ToList();
                    if (timestamps.Count < 2)
                    {
                        return data.Sum(d => d.EnergyValue);
                    }
                    double totalHours = (timestamps.Last() - timestamps.First()).TotalHours;
                    return totalHours > 0 ? data.Sum(d => d.EnergyValue) / totalHours : 0;

                case "MaxPower":
                    return data.Max(d => d.Power);

                case "AvgPower":
                    return data.Average(d => d.Power);

                default:
                    _logger.LogWarning($"Unknown formula type: {formula}. Using TotalEnergy instead.");
                    return data.Sum(d => d.EnergyValue);
            }
        }
    }
}