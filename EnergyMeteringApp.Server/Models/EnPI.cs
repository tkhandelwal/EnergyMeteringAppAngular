using System;

namespace EnergyMeteringApp.Models
{
    public class EnPI
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Formula { get; set; } = null!;
        public double BaselineValue { get; set; }
        public double CurrentValue { get; set; }
        public DateTime CalculationDate { get; set; }
        public int ClassificationId { get; set; }
        public Classification Classification { get; set; } = null!;
    }
}