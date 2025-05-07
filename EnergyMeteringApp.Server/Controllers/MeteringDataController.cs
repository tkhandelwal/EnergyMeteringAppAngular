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
    public class MeteringDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly MeteringService _meteringService;

        public MeteringDataController(ApplicationDbContext context, MeteringService meteringService)
        {
            _context = context;
            _meteringService = meteringService;
        }

        // GET: api/MeteringData
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MeteringData>>> GetMeteringData([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? classificationId = null)
        {
            return Ok(await _meteringService.GetMeteringDataAsync(startDate, endDate, classificationId));
        }

        // GET: api/MeteringData/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MeteringData>> GetMeteringData(int id)
        {
            var meteringData = await _context.MeteringData
                .Include(m => m.Classification)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meteringData == null)
            {
                return NotFound();
            }

            return meteringData;
        }

        // POST: api/MeteringData/Generate
        [HttpPost("Generate")]
        public async Task<ActionResult<IEnumerable<MeteringData>>> GenerateData(SyntheticDataRequest request)
        {
            try
            {
                var data = await _meteringService.GenerateSyntheticDataAsync(request);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/MeteringData
        [HttpPost]
        public async Task<ActionResult<MeteringData>> CreateMeteringData(MeteringData meteringData)
        {
            _context.MeteringData.Add(meteringData);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMeteringData), new { id = meteringData.Id }, meteringData);
        }

        // DELETE: api/MeteringData/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMeteringData(int id)
        {
            var meteringData = await _context.MeteringData.FindAsync(id);
            if (meteringData == null)
            {
                return NotFound();
            }

            _context.MeteringData.Remove(meteringData);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}