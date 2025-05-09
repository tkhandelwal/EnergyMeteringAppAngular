// EnergyMeteringApp.Server/Controllers/EquipmentController.cs
using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EquipmentController> _logger;

        public EquipmentController(ApplicationDbContext context, ILogger<EquipmentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Equipment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Equipment>>> GetEquipment()
        {
            try
            {
                return await _context.Equipment
                    .Include(e => e.Classifications)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching equipment");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/Equipment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetEquipment(int id)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching equipment with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/Equipment
        [HttpPost]
        public async Task<ActionResult<Equipment>> CreateEquipment(Equipment equipment)
        {
            try
            {
                _logger.LogInformation($"Creating equipment: {JsonSerializer.Serialize(equipment)}");

                // Clear classifications to avoid creation issues
                equipment.Classifications = new List<Classification>();

                _context.Equipment.Add(equipment);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Equipment created with ID: {equipment.Id}");

                // Fetch the created equipment with classifications
                var createdEquipment = await _context.Equipment
                    .Include(e => e.Classifications)
                    .FirstOrDefaultAsync(e => e.Id == equipment.Id);

                return CreatedAtAction(nameof(GetEquipment), new { id = equipment.Id }, createdEquipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating equipment");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // PUT: api/Equipment/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEquipment(int id, Equipment equipment)
        {
            if (id != equipment.Id)
            {
                return BadRequest();
            }

            try
            {
                // Get existing equipment
                var existingEquipment = await _context.Equipment
                    .Include(e => e.Classifications)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (existingEquipment == null)
                {
                    return NotFound();
                }

                // Update basic properties
                existingEquipment.Name = equipment.Name;
                existingEquipment.Description = equipment.Description;
                existingEquipment.Location = equipment.Location;
                existingEquipment.InstallDate = equipment.InstallDate;
                existingEquipment.Status = equipment.Status;

                // Don't update classifications here - use separate endpoints

                _context.Entry(existingEquipment).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
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
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating equipment with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // DELETE: api/Equipment/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEquipment(int id)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting equipment with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/Equipment/5/AddClassification/3
        [HttpPost("{equipmentId}/AddClassification/{classificationId}")]
        public async Task<IActionResult> AddClassification(int equipmentId, int classificationId)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding classification {classificationId} to equipment {equipmentId}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // DELETE: api/Equipment/5/RemoveClassification/3
        [HttpDelete("{equipmentId}/RemoveClassification/{classificationId}")]
        public async Task<IActionResult> RemoveClassification(int equipmentId, int classificationId)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing classification {classificationId} from equipment {equipmentId}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        private bool EquipmentExists(int id)
        {
            return _context.Equipment.Any(e => e.Id == id);
        }
    }
}