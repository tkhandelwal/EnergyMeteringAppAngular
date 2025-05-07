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
        public string EnergyType { get; set; } = "Electricity"; // Electricity, Gas, Water, etc.

        [Required]
        public string MeasurementUnit { get; set; } = "kWh"; // kWh, m³, etc.

        [JsonIgnore]
        public List<MeteringData> MeteringData { get; set; } = new List<MeteringData>();

        [JsonIgnore]
        public List<EnPIDefinition> EnPIDefinitions { get; set; } = new List<EnPIDefinition>();

        [JsonIgnore]
        public List<Baseline> Baselines { get; set; } = new List<Baseline>();
    }
}