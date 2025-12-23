using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using QuanLyNhanVien.Api.Hubs;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public NotificationsController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }
        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue(ClaimTypes.Email)
                ?? User.FindFirstValue("email")
                ?? User.FindFirstValue("sub")
                ?? string.Empty;
        }
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var currentUserEmail = GetCurrentUserEmail();
            if (string.IsNullOrEmpty(currentUserEmail)) return Unauthorized();

            var notifications = await _context.Notifications
                .Where(n => n.RecipientIdentifier == currentUserEmail)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .ToListAsync();

            return Ok(notifications);
        }
        [HttpPost("mark-read/{id}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var currentUserEmail = GetCurrentUserEmail();
            if (string.IsNullOrEmpty(currentUserEmail)) return Unauthorized();

            var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.RecipientIdentifier == currentUserEmail);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var currentUserEmail = GetCurrentUserEmail();
            if (string.IsNullOrEmpty(currentUserEmail)) return Unauthorized();

            var unreadNotifications = await _context.Notifications
                .Where(n => n.RecipientIdentifier == currentUserEmail && !n.IsRead)
                .ToListAsync();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}