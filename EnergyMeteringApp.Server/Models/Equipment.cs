// EnergyMeteringApp.Server/Models/Equipment.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnergyMeteringApp.Models
{
    public class Equipment
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public string? Location { get; set; }

        public DateTime InstallDate { get; set; }

        [Required]
        public string Status { get; set; } = "Active"; // Active, Inactive, Maintenance, Decommissioned

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        // Using JsonIgnore to prevent circular references in serialization
        [JsonIgnore]
        public ICollection<EquipmentClassification> EquipmentClassifications { get; set; } = new List<EquipmentClassification>();

        // This property will be included in serialization for the client
        public List<Classification> Classifications { get; set; } = new List<Classification>();

        public ICollection<MeteringData> MeteringData { get; set; } = new List<MeteringData>();
    }
}