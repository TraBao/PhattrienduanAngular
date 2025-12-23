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
        public async Task<IActionResult> Create([FromBody] Announcement model)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_ANNOUNCEMENTS"))
            {
                return Forbid();
            }

            model.CreatedAt = DateTime.Now;
            _context.Announcements.Add(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_ANNOUNCEMENTS"))
            {
                return Forbid();
            }

            var item = await _context.Announcements.FindAsync(id);
            if (item == null) return NotFound();

            _context.Announcements.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa tin." });
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        private bool HasPermission(string permissionCode)
        {
            return User.HasClaim(c => c.Type == "permissions" && c.Value.Contains(permissionCode));
        }
    }
}