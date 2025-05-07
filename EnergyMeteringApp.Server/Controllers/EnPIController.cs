using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using EnergyMeteringApp.Services;
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
    public class EnPIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EnPIService _enpiService;

        public EnPIController(ApplicationDbContext context, EnPIService enpiService)
        {
            _context = context;
            _enpiService = enpiService;
        }

        // GET: api/EnPI
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnPI>>> GetEnPIs()
        {
            return await _context.EnPIs
                .Include(e => e.Classification)
                .ToListAsync();
        }

        // GET: api/EnPI/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EnPI>> GetEnPI(int id)
        {
            var enpi = await _context.EnPIs
                .Include(e => e.Classification)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (enpi == null)
            {
                return NotFound();
            }

            return enpi;
        }

        // POST: api/EnPI/Calculate
        [HttpPost("Calculate")]
        public async Task<ActionResult<EnPI>> CalculateEnPI(EnPICalculationRequest request)
        {
            try
            {
                var enpi = await _enpiService.CalculateEnPIAsync(request);
                return Ok(enpi);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/EnPI/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnPI(int id)
        {
            var enpi = await _context.EnPIs.FindAsync(id);
            if (enpi == null)
            {
                return NotFound();
            }

            _context.EnPIs.Remove(enpi);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}