using System;

namespace EnergyMeteringApp.Models
{
    public class MeteringData
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public double EnergyValue { get; set; } // kWh
        public double Power { get; set; } // kW
        public int ClassificationId { get; set; }
        public Classification Classification { get; set; } = null!;
    }
}