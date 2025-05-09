using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaselinesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BaselinesController> _logger;

        public BaselinesController(
            ApplicationDbContext context,
            ILogger<BaselinesController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // GET: api/Baselines
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Baseline>>> GetBaselines()
        {
            try
            {
                var baselines = await _context.Baselines
                    .Include(b => b.Classification)
                    .ToListAsync();

                return Ok(baselines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching baselines");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/Baselines/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Baseline>> GetBaseline(int id)
        {
            try
            {
                var baseline = await _context.Baselines
                    .Include(b => b.Classification)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (baseline == null)
                {
                    return NotFound(new { message = $"Baseline with ID {id} not found" });
                }

                return Ok(baseline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching baseline with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/Baselines
        [HttpPost]
        public async Task<ActionResult<Baseline>> CreateBaseline(Baseline baseline)
        {
            try
            {
                if (baseline == null)
                {
                    return BadRequest(new { message = "Baseline cannot be null" });
                }

                // Validate required fields
                if (baseline.ClassificationId <= 0)
                {
                    return BadRequest(new { message = "Classification ID is required" });
                }

                if (baseline.StartDate >= baseline.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                // Check if classification exists
                var classificationExists = await _context.Classifications.AnyAsync(c => c.Id == baseline.ClassificationId);
                if (!classificationExists)
                {
                    return BadRequest(new { message = $"Classification with ID {baseline.ClassificationId} not found" });
                }

                // Set creation timestamp
                baseline.CreatedAt = DateTime.UtcNow;

                _context.Baselines.Add(baseline);
                await _context.SaveChangesAsync();

                // Reload with the classification included
                var created = await _context.Baselines
                    .Include(b => b.Classification)
                    .FirstOrDefaultAsync(b => b.Id == baseline.Id);

                return CreatedAtAction(nameof(GetBaseline), new { id = baseline.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating baseline");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // PUT: api/Baselines/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBaseline(int id, Baseline baseline)
        {
            try
            {
                if (baseline == null)
                {
                    return BadRequest(new { message = "Baseline cannot be null" });
                }

                if (id != baseline.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                // Additional validation
                if (baseline.StartDate >= baseline.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                // Check if the entity exists
                var existingBaseline = await _context.Baselines.FindAsync(id);
                if (existingBaseline == null)
                {
                    return NotFound(new { message = $"Baseline with ID {id} not found" });
                }

                // Update properties
                existingBaseline.StartDate = baseline.StartDate;
                existingBaseline.EndDate = baseline.EndDate;
                existingBaseline.Description = baseline.Description;
                // Don't update Classification or CreatedAt

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!BaselineExists(id))
                    {
                        return NotFound(new { message = $"Baseline with ID {id} not found" });
                    }
                    else
                    {
                        throw;
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating baseline with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // DELETE: api/Baselines/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBaseline(int id)
        {
            try
            {
                var baseline = await _context.Baselines.FindAsync(id);
                if (baseline == null)
                {
                    return NotFound(new { message = $"Baseline with ID {id} not found" });
                }

                _context.Baselines.Remove(baseline);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting baseline with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        private bool BaselineExists(int id)
        {
            return _context.Baselines.Any(e => e.Id == id);
        }
    }
}