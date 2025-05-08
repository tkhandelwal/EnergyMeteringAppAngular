using EnergyMeteringApp.Models;
using System.Text.Json.Serialization;

public class MeteringData
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public double EnergyValue { get; set; }
    public double Power { get; set; }

    public int EquipmentId { get; set; }
    [JsonIgnore]  // Add this attribute to break the cycle
    public Equipment Equipment { get; set; } = null!;

    public int? ClassificationId { get; set; }
    public Classification? Classification { get; set; }
}