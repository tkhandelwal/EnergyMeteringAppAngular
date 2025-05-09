using EnergyMeteringApp.Models;
using System.Text.Json.Serialization;

public class MeteringData
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public double EnergyValue { get; set; }
    public double Power { get; set; }

    public int EquipmentId { get; set; }
    [JsonIgnore]
    public Equipment? Equipment { get; set; } = null; // Make nullable but with default

    public int? ClassificationId { get; set; }
    [JsonIgnore]
    public Classification? Classification { get; set; } = null; // Make nullable but with default
}