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
    public class ActionPlansController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ActionPlansController> _logger;

        public ActionPlansController(
            ApplicationDbContext context,
            ILogger<ActionPlansController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // GET: api/ActionPlans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActionPlan>>> GetActionPlans()
        {
            try
            {
                var actionPlans = await _context.ActionPlans
                    .Include(a => a.Classification)
                    .ToListAsync();

                return Ok(actionPlans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching action plans");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // GET: api/ActionPlans/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ActionPlan>> GetActionPlan(int id)
        {
            try
            {
                var actionPlan = await _context.ActionPlans
                    .Include(a => a.Classification)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (actionPlan == null)
                {
                    return NotFound(new { message = $"Action plan with ID {id} not found" });
                }

                return Ok(actionPlan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching action plan with ID: {id}");
                return StatusCode(500, new { message = "Internal server error occurred" });
            }
        }

        // POST: api/ActionPlans
        [HttpPost]
        public async Task<ActionResult<ActionPlan>> CreateActionPlan(ActionPlan actionPlan)
        {
            try
            {
                if (actionPlan == null)
                {
                    return BadRequest(new { message = "Action plan cannot be null" });
                }

                // Validate required fields
                if (string.IsNullOrWhiteSpace(actionPlan.Name))
                {
                    return BadRequest(new { message = "Name is required" });
                }

                if (actionPlan.ClassificationId <= 0)
                {
                    return BadRequest(new { message = "Classification ID is required" });
                }

                // Check if classification exists
                var classificationExists = await _context.Classifications.AnyAsync(c => c.Id == actionPlan.ClassificationId);
                if (!classificationExists)
                {
                    return BadRequest(new { message = $"Classification with ID {actionPlan.ClassificationId} not found" });
                }

                // Validate dates
                if (actionPlan.StartDate >= actionPlan.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                // Set defaults for nullable fields
                if (string.IsNullOrWhiteSpace(actionPlan.Status))
                {
                    actionPlan.Status = "Planned";
                }

                // Set creation timestamp
                actionPlan.CreatedAt = DateTime.UtcNow;

                _context.ActionPlans.Add(actionPlan);
                await _context.SaveChangesAsync();

                // Reload with relationships
                var created = await _context.ActionPlans
                    .Include(a => a.Classification)
                    .FirstOrDefaultAsync(a => a.Id == actionPlan.Id);

                return CreatedAtAction(nameof(GetActionPlan), new { id = actionPlan.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating action plan");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // PUT: api/ActionPlans/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateActionPlan(int id, ActionPlan actionPlan)
        {
            try
            {
                if (actionPlan == null)
                {
                    return BadRequest(new { message = "Action plan cannot be null" });
                }

                if (id != actionPlan.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                // Check if the action plan exists
                var existingPlan = await _context.ActionPlans.FindAsync(id);
                if (existingPlan == null)
                {
                    return NotFound(new { message = $"Action plan with ID {id} not found" });
                }

                // Validate dates
                if (actionPlan.StartDate >= actionPlan.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                // Update properties
                existingPlan.Name = actionPlan.Name;
                existingPlan.Description = actionPlan.Description;
                existingPlan.EnergySavingEstimate = actionPlan.EnergySavingEstimate;
                existingPlan.CostEstimate = actionPlan.CostEstimate;
                existingPlan.StartDate = actionPlan.StartDate;
                existingPlan.EndDate = actionPlan.EndDate;
                existingPlan.Status = string.IsNullOrWhiteSpace(actionPlan.Status) ?
                    "Planned" : actionPlan.Status;
                existingPlan.Responsible = actionPlan.Responsible;
                existingPlan.Notes = actionPlan.Notes;
                // Don't update ClassificationId or CreatedAt

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ActionPlanExists(id))
                    {
                        return NotFound(new { message = $"Action plan with ID {id} not found" });
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
                _logger.LogError(ex, $"Error updating action plan with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        // DELETE: api/ActionPlans/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteActionPlan(int id)
        {
            try
            {
                var actionPlan = await _context.ActionPlans.FindAsync(id);
                if (actionPlan == null)
                {
                    return NotFound(new { message = $"Action plan with ID {id} not found" });
                }

                _context.ActionPlans.Remove(actionPlan);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting action plan with ID: {id}");
                return StatusCode(500, new { message = $"Internal server error occurred: {ex.Message}" });
            }
        }

        private bool ActionPlanExists(int id)
        {
            return _context.ActionPlans.Any(e => e.Id == id);
        }
    }
}