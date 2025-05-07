using EnergyMeteringApp.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace EnergyMeteringApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Existing entity sets
        public DbSet<Classification> Classifications { get; set; }
        public DbSet<MeteringData> MeteringData { get; set; }
        public DbSet<EnPI> EnPIs { get; set; }
        public DbSet<EnPIDefinition> EnPIDefinitions { get; set; }
        public DbSet<Target> Targets { get; set; }
        public DbSet<Baseline> Baselines { get; set; }
        public DbSet<ActionPlan> ActionPlans { get; set; }

        // New entity sets
        public DbSet<Equipment> Equipment { get; set; }
        public DbSet<EquipmentClassification> EquipmentClassifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Define existing relationships
            modelBuilder.Entity<MeteringData>()
                .HasOne(m => m.Classification)
                .WithMany(c => c.MeteringData)
                .HasForeignKey(m => m.ClassificationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EnPI>()
                .HasOne(e => e.Classification)
                .WithMany()
                .HasForeignKey(e => e.ClassificationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EnPIDefinition>()
                .HasOne(e => e.Classification)
                .WithMany(c => c.EnPIDefinitions)
                .HasForeignKey(e => e.ClassificationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Target>()
                .HasOne(t => t.EnPIDefinition)
                .WithMany(e => e.Targets)
                .HasForeignKey(t => t.EnPIDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Baseline>()
                .HasOne(b => b.Classification)
                .WithMany(c => c.Baselines)
                .HasForeignKey(b => b.ClassificationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ActionPlan>()
                .HasOne(a => a.Classification)
                .WithMany()
                .HasForeignKey(a => a.ClassificationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Equipment and Classification many-to-many relationship
            modelBuilder.Entity<EquipmentClassification>()
                .HasKey(ec => new { ec.EquipmentId, ec.ClassificationId });

            modelBuilder.Entity<EquipmentClassification>()
                .HasOne(ec => ec.Equipment)
                .WithMany(e => e.EquipmentClassifications)
                .HasForeignKey(ec => ec.EquipmentId);

            modelBuilder.Entity<EquipmentClassification>()
                .HasOne(ec => ec.Classification)
                .WithMany(c => c.EquipmentClassifications)
                .HasForeignKey(ec => ec.ClassificationId);

            // Add relationship between Equipment and MeteringData
            modelBuilder.Entity<MeteringData>()
                .HasOne(m => m.Equipment)
                .WithMany(e => e.MeteringData)
                .HasForeignKey(m => m.EquipmentId)
                .IsRequired(false)  // Make this optional for backward compatibility
                .OnDelete(DeleteBehavior.SetNull);

            // Add seed data if needed
            modelBuilder.Entity<Classification>().HasData(
                new Classification { Id = 1, Name = "Main Building", Type = "Facility", EnergyType = "Electricity", MeasurementUnit = "kWh" },
                new Classification { Id = 2, Name = "Server Room", Type = "Equipment", EnergyType = "Electricity", MeasurementUnit = "kWh" },
                new Classification { Id = 3, Name = "Production Line A", Type = "ProductionLine", EnergyType = "Electricity", MeasurementUnit = "kWh" }
            );
        }
    }
}