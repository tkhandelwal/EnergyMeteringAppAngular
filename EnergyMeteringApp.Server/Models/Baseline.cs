using System;
using System.ComponentModel.DataAnnotations;

namespace EnergyMeteringApp.Models
{
    public class Baseline
    {
        public int Id { get; set; }

        [Required]
        public int ClassificationId { get; set; }

        public Classification Classification { get; set; } = null!;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}