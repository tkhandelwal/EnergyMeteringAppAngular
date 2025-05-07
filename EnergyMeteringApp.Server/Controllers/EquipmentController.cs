using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;


namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EquipmentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Equipment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Equipment>>> GetEquipment()
        {
            return await _context.Equipment
                .Include(e => e.Classifications)
                .ToListAsync();
        }

        // GET: api/Equipment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetEquipment(int id)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Classifications)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound();
            }

            return equipment;
        }

        // POST: api/Equipment
        [HttpPost]
        public async Task<ActionResult<Equipment>> CreateEquipment(Equipment equipment)
        {
            _context.Equipment.Add(equipment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEquipment), new { id = equipment.Id }, equipment);
        }

        // PUT: api/Equipment/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEquipment(int id, Equipment equipment)
        {
            if (id != equipment.Id)
            {
                return BadRequest();
            }

            _context.Entry(equipment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EquipmentExists(id))
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

        // DELETE: api/Equipment/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEquipment(int id)
        {
            var equipment = await _context.Equipment.FindAsync(id);
            if (equipment == null)
            {
                return NotFound();
            }

            _context.Equipment.Remove(equipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Equipment/5/AddClassification/3
        [HttpPost("{equipmentId}/AddClassification/{classificationId}")]
        public async Task<IActionResult> AddClassification(int equipmentId, int classificationId)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Classifications)
                .FirstOrDefaultAsync(e => e.Id == equipmentId);

            var classification = await _context.Classifications.FindAsync(classificationId);

            if (equipment == null || classification == null)
            {
                return NotFound();
            }

            if (!equipment.Classifications.Any(c => c.Id == classificationId))
            {
                equipment.Classifications.Add(classification);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        // DELETE: api/Equipment/5/RemoveClassification/3
        [HttpDelete("{equipmentId}/RemoveClassification/{classificationId}")]
        public async Task<IActionResult> RemoveClassification(int equipmentId, int classificationId)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Classifications)
                .FirstOrDefaultAsync(e => e.Id == equipmentId);

            var classification = await _context.Classifications.FindAsync(classificationId);

            if (equipment == null || classification == null)
            {
                return NotFound();
            }

            if (equipment.Classifications.Any(c => c.Id == classificationId))
            {
                equipment.Classifications.Remove(classification);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private bool EquipmentExists(int id)
        {
            return _context.Equipment.Any(e => e.Id == id);
        }
    }
}