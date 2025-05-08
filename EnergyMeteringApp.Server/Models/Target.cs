// Target.cs
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

        // Add equipment reference (nullable to support both types of targets)
        public int? EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

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