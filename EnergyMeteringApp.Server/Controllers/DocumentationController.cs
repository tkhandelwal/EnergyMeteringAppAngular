// EnergyMeteringApp.Server/Controllers/DocumentationController.cs
using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using EnergyMeteringApp.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly DocumentationService _documentationService;

        public DocumentationController(
            ApplicationDbContext context,
            DocumentationService documentationService)
        {
            _context = context;
            _documentationService = documentationService;
        }

        // POST: api/Documentation/Generate
        [HttpPost("Generate")]
        public async Task<ActionResult<DocumentationResult>> GenerateDocument(DocumentationRequest request)
        {
            try
            {
                var result = await _documentationService.GenerateDocumentAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}