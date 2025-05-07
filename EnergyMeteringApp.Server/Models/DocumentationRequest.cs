// EnergyMeteringApp.Server/Models/DocumentationRequest.cs
using System;

namespace EnergyMeteringApp.Models
{
    public class DocumentationRequest
    {
        public string DocumentType { get; set; } = null!; // energyPolicy, energyReview, energyBaseline, enpiReport, actionPlan, complianceReport

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Title { get; set; } = null!;

        public bool IncludeCharts { get; set; } = true;

        public bool IncludeRawData { get; set; } = false;

        public string Format { get; set; } = "pdf"; // pdf, docx, txt
    }
}