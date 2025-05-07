namespace EnergyMeteringApp.Models
{
    public class EquipmentClassification
    {
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;

        public int ClassificationId { get; set; }
        public Classification Classification { get; set; } = null!;
    }
}