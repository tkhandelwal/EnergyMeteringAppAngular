// TargetsController.cs
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

        public TargetsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Targets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Target>>> GetTargets()
        {
            return await _context.Targets
                .Include(t => t.EnPIDefinition)
                .ThenInclude(e => e.Classification)
                .ToListAsync();
        }

        // GET: api/Targets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Target>> GetTarget(int id)
        {
            var target = await _context.Targets
                .Include(t => t.EnPIDefinition)
                .ThenInclude(e => e.Classification)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (target == null)
            {
                return NotFound();
            }

            return target;
        }

        // GET: api/Targets/Equipment/5
        [HttpGet("Equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<Target>>> GetEquipmentTargets(int equipmentId)
        {
            return await _context.Targets
                .Include(t => t.EnPIDefinition)
                .ThenInclude(e => e.Classification)
                .Where(t => t.EquipmentId == equipmentId)
                .ToListAsync();
        }

        // POST: api/Targets
        [HttpPost]
        public async Task<ActionResult<Target>> CreateTarget(Target target)
        {
            target.CreatedAt = DateTime.UtcNow;
            _context.Targets.Add(target);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTarget), new { id = target.Id }, target);
        }

        // POST: api/Targets/Equipment
        [HttpPost("Equipment")]
        public async Task<ActionResult<Target>> CreateEquipmentTarget(Target target)
        {
            // Ensure equipment exists
            var equipment = await _context.Equipment.FindAsync(target.EquipmentId);
            if (equipment == null)
            {
                return BadRequest("Equipment not found");
            }

            // Ensure EnPI definition exists
            var enpiDefinition = await _context.EnPIDefinitions.FindAsync(target.EnPIDefinitionId);
            if (enpiDefinition == null)
            {
                return BadRequest("EnPI definition not found");
            }

            target.CreatedAt = DateTime.UtcNow;
            _context.Targets.Add(target);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTarget), new { id = target.Id }, target);
        }

        // PUT: api/Targets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTarget(int id, Target target)
        {
            if (id != target.Id)
            {
                return BadRequest();
            }

            _context.Entry(target).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TargetExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Targets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTarget(int id)
        {
            var target = await _context.Targets.FindAsync(id);
            if (target == null)
            {
                return NotFound();
            }

            _context.Targets.Remove(target);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Targets/Rollup/{classificationId}
        [HttpGet("Rollup/{classificationId}")]
        public async Task<ActionResult<object>> GetTargetRollup(int classificationId)
        {
            // Get the specified classification
            var classification = await _context.Classifications
                .FirstOrDefaultAsync(c => c.Id == classificationId);

            if (classification == null)
            {
                return NotFound("Classification not found");
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
                .Where(e => e.Classifications.Any(c => allClassificationsInHierarchy.Contains(c.Id)))
                .ToListAsync();

            var equipmentIds = equipmentWithClassifications.Select(e => e.Id).ToList();

            var equipmentTargets = await _context.Targets
                .Include(t => t.EnPIDefinition)
                .Where(t => t.EquipmentId.HasValue && equipmentIds.Contains(t.EquipmentId.Value))
                .ToListAsync();

            // Combine all targets
            var allTargets = classificationTargets.Concat(equipmentTargets).ToList();

            // Group by EnPI definition and calculate aggregate values
            var rollupByEnPI = allTargets
                .GroupBy(t => t.EnPIDefinitionId)
                .Select(group => new
                {
                    EnPIDefinitionId = group.Key,
                    EnPIName = group.First().EnPIDefinition?.Name ?? "Unknown",
                    ClassificationName = group.First().EnPIDefinition?.Classification?.Name ?? "Unknown",
                    Targets = group.ToList(),
                    TargetCount = group.Count(),
                    AverageTargetValue = group.Average(t => t.TargetValue),
                    // For reduction targets, use weighted average
                    WeightedValue = group.Where(t => t.TargetType == "Reduction")
                                        .Sum(t => t.TargetValue) /
                                    (group.Count(t => t.TargetType == "Reduction") > 0
                                        ? group.Count(t => t.TargetType == "Reduction")
                                        : 1)
                })
                .ToList();

            return new
            {
                ClassificationName = classification.Name,
                ClassificationType = classification.Type,
                ClassificationLevel = classification.Level,
                ChildClassificationCount = allClassificationsInHierarchy.Count - 1,
                EquipmentCount = equipmentIds.Count,
                TotalTargetCount = allTargets.Count,
                RollupByEnPI = rollupByEnPI
            };
        }

        private async Task AddChildClassifications(int parentId, List<int> classifications)
        {
            var children = await _context.Classifications
                .Where(c => c.ParentId == parentId)
                .Select(c => c.Id)
                .ToListAsync();

            classifications.AddRange(children);

            foreach (var childId in children)
            {
                await AddChildClassifications(childId, classifications);
            }
        }

        private bool TargetExists(int id)
        {
            return _context.Targets.Any(e => e.Id == id);
        }
    }
}