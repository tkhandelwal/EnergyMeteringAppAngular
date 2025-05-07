// EnergyMeteringApp.Server/Models/DocumentationResult.cs
using System;

namespace EnergyMeteringApp.Models
{
    public class DocumentationResult
    {
        public string Title { get; set; } = null!;

        public string DocumentType { get; set; } = null!;

        public string Format { get; set; } = null!;

        public string ContentUrl { get; set; } = null!;

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}