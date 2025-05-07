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

        // POST: api/Classifications
        [HttpPost]
        public async Task<ActionResult<Classification>> CreateClassification(Classification classification)
        {
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