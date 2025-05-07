using EnergyMeteringApp.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace EnergyMeteringApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
        {
        }

        public DbSet<Classification> Classifications { get; set; }
        public DbSet<MeteringData> MeteringData { get; set; }
        public DbSet<EnPI> EnPIs { get; set; }
        public DbSet<EnPIDefinition> EnPIDefinitions { get; set; }
        public DbSet<Target> Targets { get; set; }
        public DbSet<Baseline> Baselines { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Define relationships
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

            // Add seed data if needed
            modelBuilder.Entity<Classification>().HasData(
                new Classification { Id = 1, Name = "Main Building", Type = "Facility" },
                new Classification { Id = 2, Name = "Server Room", Type = "Equipment" },
                new Classification { Id = 3, Name = "Production Line A", Type = "ProductionLine" }
            );
        }
    }
}