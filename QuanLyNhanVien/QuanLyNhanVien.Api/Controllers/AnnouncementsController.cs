using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnnouncementsController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetAnnouncements()
        {
            return Ok(await _context.Announcements
                                    .OrderByDescending(a => a.CreatedAt)
                                    .Take(10)
                                    .ToListAsync());
        }
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] Announcement model)
        {
            model.CreatedAt = DateTime.Now;
            _context.Announcements.Add(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Announcements.FindAsync(id);
            if (item == null) return NotFound();

            _context.Announcements.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa tin." });
        }
    }
}