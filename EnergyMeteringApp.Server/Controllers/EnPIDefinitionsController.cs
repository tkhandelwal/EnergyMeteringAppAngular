// EnergyMeteringApp.Server/Controllers/EnPIDefinitionsController.cs
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

        public EnPIDefinitionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/EnPIDefinitions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnPIDefinition>>> GetEnPIDefinitions()
        {
            return await _context.EnPIDefinitions
                .Include(e => e.Classification)
                .Include(e => e.Targets)
                .ToListAsync();
        }

        // GET: api/EnPIDefinitions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EnPIDefinition>> GetEnPIDefinition(int id)
        {
            var enpiDefinition = await _context.EnPIDefinitions
                .Include(e => e.Classification)
                .Include(e => e.Targets)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (enpiDefinition == null)
            {
                return NotFound();
            }

            return enpiDefinition;
        }

        // POST: api/EnPIDefinitions
        [HttpPost]
        public async Task<ActionResult<EnPIDefinition>> CreateEnPIDefinition(EnPIDefinition enpiDefinition)
        {
            enpiDefinition.CreatedAt = DateTime.UtcNow;
            _context.EnPIDefinitions.Add(enpiDefinition);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEnPIDefinition), new { id = enpiDefinition.Id }, enpiDefinition);
        }

        // PUT: api/EnPIDefinitions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnPIDefinition(int id, EnPIDefinition enpiDefinition)
        {
            if (id != enpiDefinition.Id)
            {
                return BadRequest();
            }

            _context.Entry(enpiDefinition).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EnPIDefinitionExists(id))
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

        // DELETE: api/EnPIDefinitions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnPIDefinition(int id)
        {
            var enpiDefinition = await _context.EnPIDefinitions.FindAsync(id);
            if (enpiDefinition == null)
            {
                return NotFound();
            }

            _context.EnPIDefinitions.Remove(enpiDefinition);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool EnPIDefinitionExists(int id)
        {
            return _context.EnPIDefinitions.Any(e => e.Id == id);
        }
    }
}