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
                IQueryable<MeteringData> query = _context.MeteringData
                    .Include(m => m.Classification)
                    .Include(m => m.Equipment);

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
                // Validate the request and its parameters
                if (!request.ClassificationId.HasValue && !request.EquipmentId.HasValue)
                {
                    throw new ArgumentException("Either ClassificationId or EquipmentId must be provided");
                }

                Classification? classification = null;
                Equipment? equipment = null;

                // If ClassificationId is provided, fetch it
                if (request.ClassificationId.HasValue)
                {
                    classification = await _context.Classifications.FindAsync(request.ClassificationId.Value);
                    if (classification == null)
                    {
                        throw new ArgumentException($"Classification with ID {request.ClassificationId} not found");
                    }
                }

                // If EquipmentId is provided, use that
                if (request.EquipmentId.HasValue)
                {
                    equipment = await _context.Equipment
                        .Include(e => e.Classifications)
                        .FirstOrDefaultAsync(e => e.Id == request.EquipmentId);

                    if (equipment == null)
                    {
                        throw new ArgumentException($"Equipment with ID {request.EquipmentId} not found");
                    }
                }
                else if (classification != null)
                {
                    // Find equipment that has this classification
                    equipment = await _context.Equipment
                        .Include(e => e.Classifications)
                        .FirstOrDefaultAsync(e => e.Classifications.Any(c => c.Id == classification.Id));

                    // If no equipment exists with this classification, we need to create one
                    if (equipment == null)
                    {
                        _logger.LogInformation($"No equipment found for classification {classification.Id}. Creating temporary equipment.");

                        equipment = new Equipment
                        {
                            Name = $"Auto-generated for {classification.Name}",
                            Description = $"Automatically created for data generation with classification {classification.Name}",
                            Status = "Active",
                            InstallDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow,
                            Location = "Default Location",
                            Classifications = new List<Classification> { classification }
                        };

                        _context.Equipment.Add(equipment);
                        await _context.SaveChangesAsync();
                    }
                    else if (equipment.Classifications != null && !equipment.Classifications.Any(c => c.Id == classification.Id))
                    {
                        // Make sure the equipment has this classification
                        equipment.Classifications.Add(classification);
                        await _context.SaveChangesAsync();
                    }
                }

                // Safety check - we must have an equipment at this point
                if (equipment == null)
                {
                    throw new InvalidOperationException("Failed to find or create equipment for metering data");
                }

                // If we have equipment but no classification was provided, use the first classification
                if (classification == null && equipment.Classifications?.Any() == true)
                {
                    classification = equipment.Classifications.First();
                }
                else if (classification == null)
                {
                    throw new ArgumentException("No classification found or provided for data generation");
                }

                // Rest of the method (data generation) remains the same
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
                        ClassificationId = classification.Id,
                        EquipmentId = equipment.Id
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