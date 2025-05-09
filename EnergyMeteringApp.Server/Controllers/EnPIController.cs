using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using EnergyMeteringApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnPIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EnPIService _enpiService;
        private readonly ILogger<EnPIController> _logger;

        public EnPIController(
            ApplicationDbContext context,
            EnPIService enpiService,
            ILogger<EnPIController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _enpiService = enpiService ?? throw new ArgumentNullException(nameof(enpiService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // GET: api/EnPI
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnPI>>> GetEnPIs()
        {
            try
            {
                var enpis = await _context.EnPIs
                    .Include(e => e.Classification)
                    .ToListAsync();

                return Ok(enpis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching EnPIs");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/EnPI/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EnPI>> GetEnPI(int id)
        {
            try
            {
                var enpi = await _context.EnPIs
                    .Include(e => e.Classification)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enpi == null)
                {
                    return NotFound(new { message = $"EnPI with ID {id} not found" });
                }

                return Ok(enpi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching EnPI with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/EnPI/Calculate
        [HttpPost("Calculate")]
        public async Task<ActionResult<EnPI>> CalculateEnPI(EnPICalculationRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { message = "Request cannot be null" });
                }

                // Validate required fields
                if (request.ClassificationId <= 0)
                {
                    return BadRequest(new { message = "Classification ID is required" });
                }

                if (request.StartDate >= request.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                // Check if classification exists
                var classificationExists = await _context.Classifications.AnyAsync(c => c.Id == request.ClassificationId);
                if (!classificationExists)
                {
                    return BadRequest(new { message = $"Classification with ID {request.ClassificationId} not found" });
                }

                // If baseline dates are provided, validate them
                if (request.BaselineStartDate.HasValue && request.BaselineEndDate.HasValue)
                {
                    if (request.BaselineStartDate.Value >= request.BaselineEndDate.Value)
                    {
                        return BadRequest(new { message = "Baseline start date must be before baseline end date" });
                    }
                }

                // Use a default formula if none is provided
                if (string.IsNullOrWhiteSpace(request.Formula))
                {
                    request.Formula = "TotalEnergy";
                }

                // Use a default name if none is provided
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    var classification = await _context.Classifications.FindAsync(request.ClassificationId);
                    request.Name = $"{classification?.Name ?? "Unknown"} - {request.Formula}";
                }

                var enpi = await _enpiService.CalculateEnPIAsync(request);
                return Ok(enpi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating EnPI");
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/EnPI/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnPI(int id)
        {
            try
            {
                var enpi = await _context.EnPIs.FindAsync(id);
                if (enpi == null)
                {
                    return NotFound(new { message = $"EnPI with ID {id} not found" });
                }

                _context.EnPIs.Remove(enpi);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting EnPI with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }
    }
}