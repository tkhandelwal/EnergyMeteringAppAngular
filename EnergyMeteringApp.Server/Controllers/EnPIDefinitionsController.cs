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
    public class EnPIDefinitionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EnPIDefinitionsController> _logger;

        public EnPIDefinitionsController(
            ApplicationDbContext context,
            ILogger<EnPIDefinitionsController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // GET: api/EnPIDefinitions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnPIDefinition>>> GetEnPIDefinitions()
        {
            try
            {
                var definitions = await _context.EnPIDefinitions
                    .Include(e => e.Classification)
                    .Include(e => e.Targets)
                    .ToListAsync();

                return Ok(definitions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching EnPI definitions");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/EnPIDefinitions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EnPIDefinition>> GetEnPIDefinition(int id)
        {
            try
            {
                var enpiDefinition = await _context.EnPIDefinitions
                    .Include(e => e.Classification)
                    .Include(e => e.Targets)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enpiDefinition == null)
                {
                    return NotFound(new { message = $"EnPI definition with ID {id} not found" });
                }

                return Ok(enpiDefinition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching EnPI definition with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/EnPIDefinitions
        [HttpPost]
        public async Task<ActionResult<EnPIDefinition>> CreateEnPIDefinition(EnPIDefinition enpiDefinition)
        {
            try
            {
                if (enpiDefinition == null)
                {
                    return BadRequest(new { message = "EnPI definition cannot be null" });
                }

                // Validate required fields
                if (string.IsNullOrWhiteSpace(enpiDefinition.Name))
                {
                    return BadRequest(new { message = "Name is required" });
                }

                if (enpiDefinition.ClassificationId <= 0)
                {
                    return BadRequest(new { message = "Classification ID is required" });
                }

                if (string.IsNullOrWhiteSpace(enpiDefinition.FormulaType))
                {
                    enpiDefinition.FormulaType = "TotalEnergy";
                }

                // Check if classification exists
                var classificationExists = await _context.Classifications.AnyAsync(c => c.Id == enpiDefinition.ClassificationId);
                if (!classificationExists)
                {
                    return BadRequest(new { message = $"Classification with ID {enpiDefinition.ClassificationId} not found" });
                }

                // Set the NormalizeBy to "None" if not provided
                if (string.IsNullOrWhiteSpace(enpiDefinition.NormalizeBy))
                {
                    enpiDefinition.NormalizeBy = "None";
                }

                // Set the creation timestamp
                enpiDefinition.CreatedAt = DateTime.UtcNow;

                // Initialize the Targets collection if null
                if (enpiDefinition.Targets == null)
                {
                    enpiDefinition.Targets = new List<Target>();
                }

                _context.EnPIDefinitions.Add(enpiDefinition);
                await _context.SaveChangesAsync();

                // Reload the entity with its relationships
                var created = await _context.EnPIDefinitions
                    .Include(e => e.Classification)
                    .Include(e => e.Targets)
                    .FirstOrDefaultAsync(e => e.Id == enpiDefinition.Id);

                return CreatedAtAction(nameof(GetEnPIDefinition), new { id = enpiDefinition.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating EnPI definition");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // PUT: api/EnPIDefinitions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnPIDefinition(int id, EnPIDefinition enpiDefinition)
        {
            try
            {
                if (enpiDefinition == null)
                {
                    return BadRequest(new { message = "EnPI definition cannot be null" });
                }

                if (id != enpiDefinition.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                // Check if the entity exists
                var existingDefinition = await _context.EnPIDefinitions.FindAsync(id);
                if (existingDefinition == null)
                {
                    return NotFound(new { message = $"EnPI definition with ID {id} not found" });
                }

                // Update only the fields that can be changed
                existingDefinition.Name = enpiDefinition.Name;
                existingDefinition.FormulaType = string.IsNullOrWhiteSpace(enpiDefinition.FormulaType) ?
                    "TotalEnergy" : enpiDefinition.FormulaType;
                existingDefinition.NormalizeBy = string.IsNullOrWhiteSpace(enpiDefinition.NormalizeBy) ?
                    "None" : enpiDefinition.NormalizeBy;
                existingDefinition.NormalizationUnit = enpiDefinition.NormalizationUnit;
                existingDefinition.Description = enpiDefinition.Description;

                // Don't change creation date or targets directly

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!EnPIDefinitionExists(id))
                    {
                        return NotFound(new { message = $"EnPI definition with ID {id} not found" });
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
                _logger.LogError(ex, $"Error updating EnPI definition with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // DELETE: api/EnPIDefinitions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnPIDefinition(int id)
        {
            try
            {
                var enpiDefinition = await _context.EnPIDefinitions
                    .Include(e => e.Targets)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enpiDefinition == null)
                {
                    return NotFound(new { message = $"EnPI definition with ID {id} not found" });
                }

                // Check if there are any targets referencing this definition
                if (enpiDefinition.Targets != null && enpiDefinition.Targets.Any())
                {
                    return BadRequest(new { message = $"Cannot delete: EnPI definition is referenced by {enpiDefinition.Targets.Count} targets" });
                }

                _context.EnPIDefinitions.Remove(enpiDefinition);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting EnPI definition with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        private bool EnPIDefinitionExists(int id)
        {
            return _context.EnPIDefinitions.Any(e => e.Id == id);
        }
    }
}