using System;
using System.ComponentModel.DataAnnotations;

namespace EnergyMeteringApp.Models
{
    public class Target
    {
        public int Id { get; set; }

        [Required]
        public int EnPIDefinitionId { get; set; }

        public EnPIDefinition EnPIDefinition { get; set; } = null!;

        [Required]
        public double TargetValue { get; set; }

        [Required]
        public string TargetType { get; set; } = "Reduction"; // Reduction, AbsoluteValue, MaximumValue

        [Required]
        public DateTime TargetDate { get; set; }

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}