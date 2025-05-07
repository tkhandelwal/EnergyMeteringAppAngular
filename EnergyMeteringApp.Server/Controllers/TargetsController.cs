// EnergyMeteringApp.Server/Controllers/TargetsController.cs
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

        // POST: api/Targets
        [HttpPost]
        public async Task<ActionResult<Target>> CreateTarget(Target target)
        {
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

        private bool TargetExists(int id)
        {
            return _context.Targets.Any(e => e.Id == id);
        }
    }
}