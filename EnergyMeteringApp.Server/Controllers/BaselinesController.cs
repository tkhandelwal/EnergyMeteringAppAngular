// EnergyMeteringApp.Server/Controllers/BaselinesController.cs
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

        public BaselinesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Baselines
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Baseline>>> GetBaselines()
        {
            return await _context.Baselines
                .Include(b => b.Classification)
                .ToListAsync();
        }

        // GET: api/Baselines/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Baseline>> GetBaseline(int id)
        {
            var baseline = await _context.Baselines
                .Include(b => b.Classification)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (baseline == null)
            {
                return NotFound();
            }

            return baseline;
        }

        // POST: api/Baselines
        [HttpPost]
        public async Task<ActionResult<Baseline>> CreateBaseline(Baseline baseline)
        {
            baseline.CreatedAt = DateTime.UtcNow;
            _context.Baselines.Add(baseline);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBaseline), new { id = baseline.Id }, baseline);
        }

        // PUT: api/Baselines/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBaseline(int id, Baseline baseline)
        {
            if (id != baseline.Id)
            {
                return BadRequest();
            }

            _context.Entry(baseline).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BaselineExists(id))
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

        // DELETE: api/Baselines/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBaseline(int id)
        {
            var baseline = await _context.Baselines.FindAsync(id);
            if (baseline == null)
            {
                return NotFound();
            }

            _context.Baselines.Remove(baseline);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BaselineExists(int id)
        {
            return _context.Baselines.Any(e => e.Id == id);
        }
    }
}