// EnergyMeteringApp.Server/Models/ActionPlan.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace EnergyMeteringApp.Models
{
    public class ActionPlan
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public int ClassificationId { get; set; }

        public Classification Classification { get; set; } = null!;

        public string? Description { get; set; }

        public double EnergySavingEstimate { get; set; }

        public double CostEstimate { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public string Status { get; set; } = "Planned"; // Planned, InProgress, Completed, Delayed, Cancelled

        public string? Responsible { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}