using System;

namespace EnergyMeteringApp.Models
{
    public class MeteringData
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public double EnergyValue { get; set; } // kWh
        public double Power { get; set; } // kW

        // Updated to reference equipment directly
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;

        // Keep classification for backward compatibility and filtering
        public int? ClassificationId { get; set; }
        public Classification? Classification { get; set; }
    }
}