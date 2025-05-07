using System;

namespace EnergyMeteringApp.Models
{
    public class EnPICalculationRequest
    {
        public string? Name { get; set; } = null;
        public string? Formula { get; set; }
        public int ClassificationId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? BaselineStartDate { get; set; }
        public DateTime? BaselineEndDate { get; set; }
    }
}