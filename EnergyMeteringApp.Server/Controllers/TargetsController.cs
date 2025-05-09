using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
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
    public class TargetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TargetsController> _logger;

        public TargetsController(
            ApplicationDbContext context,
            ILogger<TargetsController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // GET: api/Targets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Target>>> GetTargets()
        {
            try
            {
                var targets = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e != null ? e.Classification : null)
                    .ToListAsync();

                return Ok(targets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching targets");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/Targets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Target>> GetTarget(int id)
        {
            try
            {
                var target = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e != null ? e.Classification : null)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (target == null)
                {
                    return NotFound(new { message = $"Target with ID {id} not found" });
                }

                return Ok(target);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching target with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/Targets/Equipment/5
        [HttpGet("Equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<Target>>> GetEquipmentTargets(int equipmentId)
        {
            try
            {
                // Check if equipment exists
                var equipmentExists = await _context.Equipment.AnyAsync(e => e.Id == equipmentId);
                if (!equipmentExists)
                {
                    return NotFound(new { message = $"Equipment with ID {equipmentId} not found" });
                }

                var targets = await _context.Targets
                    .Where(t => t.EquipmentId == equipmentId)
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e != null ? e.Classification : null)
                    .ToListAsync();

                return Ok(targets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching targets for equipment ID: {equipmentId}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/Targets
        [HttpPost]
        public async Task<ActionResult<Target>> CreateTarget(Target target)
        {
            try
            {
                if (target == null)
                {
                    return BadRequest(new { message = "Target cannot be null" });
                }

                // Validate required fields
                if (target.EnPIDefinitionId <= 0)
                {
                    return BadRequest(new { message = "EnPI definition ID is required" });
                }

                if (string.IsNullOrWhiteSpace(target.TargetType))
                {
                    target.TargetType = "Reduction"; // Default target type
                }

                // Check if EnPI definition exists
                var enpiDefinition = await _context.EnPIDefinitions.FindAsync(target.EnPIDefinitionId);
                if (enpiDefinition == null)
                {
                    return BadRequest(new { message = $"EnPI definition with ID {target.EnPIDefinitionId} not found" });
                }

                // Set creation timestamp
                target.CreatedAt = DateTime.UtcNow;

                _context.Targets.Add(target);
                await _context.SaveChangesAsync();

                // Reload with relationships
                var created = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e != null ? e.Classification : null)
                    .FirstOrDefaultAsync(t => t.Id == target.Id);

                return CreatedAtAction(nameof(GetTarget), new { id = target.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating target");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // POST: api/Targets/Equipment
        [HttpPost("Equipment")]
        public async Task<ActionResult<Target>> CreateEquipmentTarget(Target target)
        {
            try
            {
                if (target == null)
                {
                    return BadRequest(new { message = "Target cannot be null" });
                }

                // Validate required fields
                if (target.EnPIDefinitionId <= 0)
                {
                    return BadRequest(new { message = "EnPI definition ID is required" });
                }

                if (!target.EquipmentId.HasValue || target.EquipmentId <= 0)
                {
                    return BadRequest(new { message = "Equipment ID is required" });
                }

                // Ensure equipment exists
                var equipment = await _context.Equipment.FindAsync(target.EquipmentId);
                if (equipment == null)
                {
                    return BadRequest(new { message = "Equipment not found" });
                }

                // Ensure EnPI definition exists
                var enpiDefinition = await _context.EnPIDefinitions.FindAsync(target.EnPIDefinitionId);
                if (enpiDefinition == null)
                {
                    return BadRequest(new { message = "EnPI definition not found" });
                }

                if (string.IsNullOrWhiteSpace(target.TargetType))
                {
                    target.TargetType = "Reduction"; // Default target type
                }

                target.CreatedAt = DateTime.UtcNow;
                _context.Targets.Add(target);
                await _context.SaveChangesAsync();

                // Reload with relationships
                var created = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e != null ? e.Classification : null)
                    .Include(t => t.Equipment)
                    .FirstOrDefaultAsync(t => t.Id == target.Id);

                return CreatedAtAction(nameof(GetTarget), new { id = target.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating equipment target");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // PUT: api/Targets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTarget(int id, Target target)
        {
            try
            {
                if (target == null)
                {
                    return BadRequest(new { message = "Target cannot be null" });
                }

                if (id != target.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                // Check if target exists
                var existingTarget = await _context.Targets.FindAsync(id);
                if (existingTarget == null)
                {
                    return NotFound(new { message = $"Target with ID {id} not found" });
                }

                // Update properties
                existingTarget.TargetValue = target.TargetValue;
                existingTarget.TargetType = string.IsNullOrWhiteSpace(target.TargetType) ?
                    "Reduction" : target.TargetType;
                existingTarget.TargetDate = target.TargetDate;
                existingTarget.Description = target.Description;
                // Don't update EnPIDefinitionId, EquipmentId, or CreatedAt

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!TargetExists(id))
                    {
                        return NotFound(new { message = $"Target with ID {id} not found" });
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
                _logger.LogError(ex, $"Error updating target with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // DELETE: api/Targets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTarget(int id)
        {
            try
            {
                var target = await _context.Targets.FindAsync(id);
                if (target == null)
                {
                    return NotFound(new { message = $"Target with ID {id} not found" });
                }

                _context.Targets.Remove(target);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting target with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // GET: api/Targets/Rollup/{classificationId}
        [HttpGet("Rollup/{classificationId}")]
        public async Task<ActionResult<object>> GetTargetRollup(int classificationId)
        {
            try
            {
                // Check if classification exists
                var classification = await _context.Classifications
                    .FirstOrDefaultAsync(c => c.Id == classificationId);

                if (classification == null)
                {
                    return NotFound(new { message = "Classification not found" });
                }

                // Get all classifications in the hierarchy under this one
                var allClassificationsInHierarchy = new List<int> { classificationId };
                await AddChildClassifications(classificationId, allClassificationsInHierarchy);

                // Get all targets for these classifications
                var classificationTargets = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .Where(t => t.EnPIDefinition != null &&
                              allClassificationsInHierarchy.Contains(t.EnPIDefinition.ClassificationId))
                    .ToListAsync();

                // Get all equipment targets for equipment belonging to these classifications
                var equipmentWithClassifications = await _context.Equipment
                    .Include(e => e.Classifications)
                    .Where(e => e.Classifications != null &&
                              e.Classifications.Any(c => c != null &&
                                                       allClassificationsInHierarchy.Contains(c.Id)))
                    .ToListAsync();

                var equipmentIds = equipmentWithClassifications
                    .Select(e => e.Id)
                    .ToList();

                var equipmentTargets = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .Where(t => t.EquipmentId.HasValue && equipmentIds.Contains(t.EquipmentId.Value))
                    .ToListAsync();

                // Combine all targets
                var allTargets = classificationTargets.Concat(equipmentTargets).ToList();

                // Group by EnPI definition and calculate aggregate values
                var rollupByEnPI = allTargets
                    .Where(t => t.EnPIDefinition != null)
                    .GroupBy(t => t.EnPIDefinitionId)
                    .Select(group => {
                        // Safe access to the first element's properties with null checks
                        var firstItem = group.First();
                        string enpiName = firstItem.EnPIDefinition?.Name ?? "Unknown";
                        string className = firstItem.EnPIDefinition?.Classification?.Name ?? "Unknown";

                        // Count targets
                        int targetCount = group.Count();

                        // Calculate average target value
                        double avgTargetValue = group.Average(t => t.TargetValue);

                        // Calculate weighted value for reduction targets
                        double weightedValue = 0;
                        int reductionCount = group.Count(t => t.TargetType == "Reduction");

                        if (reductionCount > 0)
                        {
                            weightedValue = group
                                .Where(t => t.TargetType == "Reduction")
                                .Sum(t => t.TargetValue) / reductionCount;
                        }

                        return new
                        {
                            EnPIDefinitionId = group.Key,
                            EnPIName = enpiName,
                            ClassificationName = className,
                            Targets = group.ToList(),
                            TargetCount = targetCount,
                            AverageTargetValue = avgTargetValue,
                            WeightedValue = weightedValue
                        };
                    })
                    .ToList();

                // Return the rollup data
                return new
                {
                    ClassificationName = classification.Name ?? "Unknown",
                    ClassificationType = classification.Type ?? "Unknown",
                    ClassificationLevel = classification.Level ?? "Unknown",
                    ChildClassificationCount = allClassificationsInHierarchy.Count - 1,
                    EquipmentCount = equipmentIds.Count,
                    TotalTargetCount = allTargets.Count,
                    RollupByEnPI = rollupByEnPI
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting target rollup for classification ID: {classificationId}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        private async Task AddChildClassifications(int parentId, List<int> classifications)
        {
            try
            {
                var children = await _context.Classifications
                    .Where(c => c.ParentId == parentId)
                    .Select(c => c.Id)
                    .ToListAsync();

                if (children != null && children.Any())
                {
                    classifications.AddRange(children);

                    foreach (var childId in children)
                    {
                        await AddChildClassifications(childId, classifications);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding child classifications for parent ID: {parentId}");
                throw;
            }
        }

        private bool TargetExists(int id)
        {
            return _context.Targets.Any(e => e.Id == id);
        }
    }
}