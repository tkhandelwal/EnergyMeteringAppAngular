// EnergyMeteringApp.Server/Controllers/ReportsController.cs
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost("word")]
    public async Task<IActionResult> GenerateWordReport(ReportRequest request)
    {
        try
        {
            var reportPath = await _reportService.GenerateWordReport(request);
            return Ok(new { path = reportPath });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}