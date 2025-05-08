// ClassificationsController.cs
using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Classifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Classification>>> GetClassifications()
        {
            return await _context.Classifications.ToListAsync();
        }

        // GET: api/Classifications/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Classification>> GetClassification(int id)
        {
            var classification = await _context.Classifications.FindAsync(id);

            if (classification == null)
            {
                return NotFound();
            }

            return classification;
        }

        // GET: api/Classifications/Hierarchy
        [HttpGet("Hierarchy")]
        public async Task<ActionResult<IEnumerable<object>>> GetClassificationHierarchy()
        {
            // Get top-level classifications (Organization level)
            var topLevelClassifications = await _context.Classifications
                .Where(c => c.ParentId == null)
                .ToListAsync();

            // Build hierarchical structure
            var hierarchy = new List<object>();

            foreach (var topLevel in topLevelClassifications)
            {
                hierarchy.Add(await BuildClassificationHierarchy(topLevel));
            }

            return hierarchy;
        }

        private async Task<object> BuildClassificationHierarchy(Classification classification)
        {
            // Get children
            var children = await _context.Classifications
                .Where(c => c.ParentId == classification.Id)
                .ToListAsync();

            var childrenObjects = new List<object>();

            foreach (var child in children)
            {
                childrenObjects.Add(await BuildClassificationHierarchy(child));
            }

            // Get equipment for this classification
            var equipment = await _context.Equipment
                .Include(e => e.Classifications)
                .Where(e => e.Classifications.Any(c => c.Id == classification.Id))
                .ToListAsync();

            var equipmentObjects = equipment.Select(e => new
            {
                id = e.Id,
                name = e.Name,
                type = "Equipment",
                status = e.Status
            }).ToList();

            return new
            {
                id = classification.Id,
                name = classification.Name,
                type = classification.Type,
                level = classification.Level,
                children = childrenObjects,
                equipment = equipmentObjects
            };
        }

        // POST: api/Classifications
        [HttpPost]
        public async Task<ActionResult<Classification>> CreateClassification(Classification classification)
        {
            _context.Classifications.Add(classification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClassification), new { id = classification.Id }, classification);
        }

        // POST: api/Classifications/WithParent
        [HttpPost("WithParent")]
        public async Task<ActionResult<Classification>> CreateClassificationWithParent(Classification classification)
        {
            // If parent is specified, validate it exists
            if (classification.ParentId.HasValue)
            {
                var parentExists = await _context.Classifications.AnyAsync(c => c.Id == classification.ParentId);
                if (!parentExists)
                {
                    return BadRequest("Parent classification not found");
                }
            }

            _context.Classifications.Add(classification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClassification), new { id = classification.Id }, classification);
        }

        // PUT: api/Classifications/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClassification(int id, Classification classification)
        {
            if (id != classification.Id)
            {
                return BadRequest();
            }

            _context.Entry(classification).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClassificationExists(id))
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

        // DELETE: api/Classifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClassification(int id)
        {
            var classification = await _context.Classifications.FindAsync(id);
            if (classification == null)
            {
                return NotFound();
            }

            _context.Classifications.Remove(classification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ClassificationExists(int id)
        {
            return _context.Classifications.Any(e => e.Id == id);
        }
    }
}