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
            _context = context;
            _meteringService = meteringService;
            _logger = logger;
        }

        public async Task<EnPI> CalculateEnPIAsync(EnPICalculationRequest request)
        {
            try
            {
                // Validate request
                var classification = await _context.Classifications.FindAsync(request.ClassificationId);
                if (classification == null)
                {
                    throw new ArgumentException("Classification not found");
                }

                // Get current period data
                var currentPeriodData = await _meteringService.GetMeteringDataAsync(
                    request.StartDate,
                    request.EndDate,
                    request.ClassificationId);

                if (!currentPeriodData.Any())
                {
                    throw new ArgumentException("No data available for the selected period");
                }

                // Calculate current value based on formula
                double currentValue = CalculateMetric(currentPeriodData, request.Formula);

                // Calculate baseline value if requested
                double baselineValue = 0;
                if (request.BaselineStartDate.HasValue && request.BaselineEndDate.HasValue)
                {
                    var baselineData = await _meteringService.GetMeteringDataAsync(
                        request.BaselineStartDate,
                        request.BaselineEndDate,
                        request.ClassificationId);

                    if (baselineData.Any())
                    {
                        baselineValue = CalculateMetric(baselineData, request.Formula);
                    }
                }

                // Create and save the EnPI
                var enpi = new EnPI
                {
                    Name = request.Name,
                    Formula = request.Formula,
                    BaselineValue = baselineValue,
                    CurrentValue = currentValue,
                    CalculationDate = DateTime.UtcNow,
                    ClassificationId = request.ClassificationId
                };

                _context.EnPIs.Add(enpi);
                await _context.SaveChangesAsync();

                return enpi;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating EnPI");
                throw;
            }
        }

        private double CalculateMetric(IEnumerable<MeteringData> data, string formula)
        {
            if (string.IsNullOrEmpty(formula))
            {
                // Default to TotalEnergy if formula is null or empty
                return data.Sum(d => d.EnergyValue);
            }

            switch (formula)
            {
                case "TotalEnergy":
                    return data.Sum(d => d.EnergyValue);

                case "EnergyPerHour":
                    double totalHours = (data.Max(d => d.Timestamp) - data.Min(d => d.Timestamp)).TotalHours;
                    return totalHours > 0 ? data.Sum(d => d.EnergyValue) / totalHours : 0;

                case "MaxPower":
                    return data.Max(d => d.Power);

                case "AvgPower":
                    return data.Average(d => d.Power);

                default:
                    return data.Sum(d => d.EnergyValue); // Default to TotalEnergy for unknown formulas
            }
        }
    }
}