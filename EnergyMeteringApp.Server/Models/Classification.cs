// Classification.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace EnergyMeteringApp.Models
{
    public class Classification
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string Type { get; set; } = null!; // Equipment, Facility, ProductionLine, etc.

        [Required]
        public string Category { get; set; } = "General"; // General, Equipment Type, Location, Function, etc.

        public string? Color { get; set; } = "#3498db";

        [Required]
        public string EnergyType { get; set; } = "Electricity"; // Electricity, Gas, Water, etc.

        [Required]
        public string MeasurementUnit { get; set; } = "kWh"; // kWh, m³, etc.

        // Hierarchical relationship
        public int? ParentId { get; set; }
        public Classification? Parent { get; set; }

        [JsonIgnore]
        public List<Classification> Children { get; set; } = new List<Classification>();

        // Add a Level property to identify the hierarchy level
        public string Level { get; set; } = "Equipment"; // Organization, Facility, Unit, Equipment

        // Add this missing navigation property for MeteringData
        [JsonIgnore]
        public List<MeteringData> MeteringData { get; set; } = new List<MeteringData>();

        // Equipment relationships
        [JsonIgnore]
        public ICollection<EquipmentClassification> EquipmentClassifications { get; set; } = new List<EquipmentClassification>();

        // Navigation property for many-to-many relationship with Equipment
        [JsonIgnore]
        public List<Equipment> Equipment { get; set; } = new List<Equipment>();

        // Other relationships
        [JsonIgnore]
        public List<EnPIDefinition> EnPIDefinitions { get; set; } = new List<EnPIDefinition>();

        [JsonIgnore]
        public List<Baseline> Baselines { get; set; } = new List<Baseline>();
    }
}