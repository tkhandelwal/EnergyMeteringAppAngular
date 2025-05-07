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
    public class MeteringService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MeteringService> _logger;

        public MeteringService(ApplicationDbContext context, ILogger<MeteringService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<MeteringData>> GetMeteringDataAsync(
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? classificationId = null)
        {
            try
            {
                IQueryable<MeteringData> query = _context.MeteringData.Include(m => m.Classification);

                // Apply filters
                if (startDate.HasValue)
                {
                    query = query.Where(m => m.Timestamp >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(m => m.Timestamp <= endDate.Value);
                }

                if (classificationId.HasValue)
                {
                    query = query.Where(m => m.ClassificationId == classificationId.Value);
                }

                return await query.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting metering data");
                throw;
            }
        }

        public async Task<List<MeteringData>> GenerateSyntheticDataAsync(SyntheticDataRequest request)
        {
            try
            {
                var classification = await _context.Classifications.FindAsync(request.ClassificationId);
                if (classification == null)
                {
                    throw new ArgumentException("Classification not found");
                }

                var generatedData = new List<MeteringData>();
                var startDate = request.StartDate;
                var endDate = request.EndDate;

                // Basic patterns
                double baseValue = request.BaseValue;
                double variance = request.Variance;

                var random = new Random();

                // Generate data for each interval
                for (DateTime date = startDate; date <= endDate; date = date.AddMinutes(request.IntervalMinutes))
                {
                    // Create patterns based on time of day and day of week
                    double timeOfDayFactor = GetTimeOfDayFactor(date);
                    double dayOfWeekFactor = GetDayOfWeekFactor(date);

                    // Add some randomness
                    double randomFactor = (random.NextDouble() * 2 - 1) * variance;

                    // Calculate the energy value with patterns
                    double energyValue = baseValue * timeOfDayFactor * dayOfWeekFactor + randomFactor;

                    // Ensure non-negative values
                    energyValue = Math.Max(0, energyValue);

                    // Calculate power (kW) based on energy consumption over interval
                    double power = energyValue * 60 / request.IntervalMinutes;

                    var meteringData = new MeteringData
                    {
                        Timestamp = date,
                        EnergyValue = energyValue,
                        Power = power,
                        ClassificationId = request.ClassificationId,
                    };

                    generatedData.Add(meteringData);
                }

                _context.MeteringData.AddRange(generatedData);
                await _context.SaveChangesAsync();

                return generatedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating synthetic data");
                throw;
            }
        }

        // Helper methods for synthetic data generation
        private double GetTimeOfDayFactor(DateTime date)
        {
            int hour = date.Hour;

            // Simulate higher usage during working hours
            if (hour >= 8 && hour <= 17)
            {
                return 1.0 + 0.5 * Math.Sin((hour - 8) * Math.PI / 9); // Peak at mid-day
            }
            else if (hour >= 18 && hour <= 22)
            {
                return 0.7; // Evening
            }
            else
            {
                return 0.3; // Night
            }
        }

        private double GetDayOfWeekFactor(DateTime date)
        {
            // Weekends have lower usage
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
            {
                return 0.6;
            }
            return 1.0;
        }
    }
}