﻿using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using EnergyMeteringApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<MeteringDataController> _logger;

        public MeteringDataController(
            ApplicationDbContext context,
            MeteringService meteringService,
            ILogger<MeteringDataController> logger)
        {
            _context = context;
            _meteringService = meteringService;
            _logger = logger;
        }

        // GET: api/MeteringData
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MeteringData>>> GetMeteringData(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? classificationId = null)
        {
            return Ok(await _meteringService.GetMeteringDataAsync(startDate, endDate, classificationId));
        }

        // GET: api/MeteringData/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MeteringData>> GetMeteringData(int id)
        {
            var meteringData = await _context.MeteringData
                .Include(m => m.Classification)
                .Include(m => m.Equipment)
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
                // Validate the request
                if (request == null)
                {
                    return BadRequest("Request cannot be null");
                }

                if (request.StartDate >= request.EndDate)
                {
                    return BadRequest("Start date must be before end date");
                }

                // Try to find the equipment
                var equipment = await _context.Equipment.FindAsync(request.EquipmentId);
                if (equipment == null)
                {
                    return BadRequest($"Equipment with ID {request.EquipmentId} not found");
                }

                // Handle classification
                int classificationId; // Initialize variable first

                // Check if ClassificationId has a value (must use request.ClassificationId != null instead of HasValue)
                if (request.ClassificationId.HasValue)
                {
                    // Check if classification exists
                    var classificationExists = await _context.Classifications.AnyAsync(c => c.Id == request.ClassificationId.Value);
                    if (!classificationExists)
                    {
                        return BadRequest($"Classification with ID {request.ClassificationId.Value} not found");
                    }

                    classificationId = request.ClassificationId.Value;
                }
                else
                {
                    // Use the first classification of the equipment
                    var equipmentWithClassifications = await _context.Equipment
                        .Include(e => e.Classifications)
                        .FirstOrDefaultAsync(e => e.Id == request.EquipmentId);

                    // Add null check for the equipment itself
                    if (equipmentWithClassifications == null)
                    {
                        return BadRequest($"Equipment with ID {request.EquipmentId} not found");
                    }

                    // Check the Classifications collection
                    if (equipmentWithClassifications.Classifications == null ||
                        equipmentWithClassifications.Classifications.Count == 0)
                    {
                        return BadRequest("Equipment must have at least one classification to generate data");
                    }

                    classificationId = equipmentWithClassifications.Classifications.First().Id;
                }

                // Create a new request object with the determined classification ID
                var dataRequest = new SyntheticDataRequest
                {
                    ClassificationId = classificationId,
                    EquipmentId = request.EquipmentId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    IntervalMinutes = request.IntervalMinutes,
                    BaseValue = request.BaseValue,
                    Variance = request.Variance
                };

                var data = await _meteringService.GenerateSyntheticDataAsync(dataRequest);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating synthetic data");
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/MeteringData
        [HttpPost]
        public async Task<ActionResult<MeteringData>> CreateMeteringData(MeteringData meteringData)
        {
            try
            {
                // Ensure EquipmentId is set
                if (meteringData.EquipmentId <= 0)
                {
                    return BadRequest("EquipmentId is required");
                }

                _context.MeteringData.Add(meteringData);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMeteringData), new { id = meteringData.Id }, meteringData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating metering data");
                return BadRequest(new { message = ex.Message });
            }
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