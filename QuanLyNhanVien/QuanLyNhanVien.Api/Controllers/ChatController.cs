using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using Microsoft.AspNetCore.Authorization;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] string? receiverId, [FromQuery] int type)
        {
            var currentUserEmail = User.FindFirst(ClaimTypes.Name)?.Value
                                   ?? User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(currentUserEmail)) currentUserEmail = User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(currentUserEmail)) currentUserEmail = User.FindFirst("unique_name")?.Value;
            if (string.IsNullOrEmpty(currentUserEmail)) currentUserEmail = User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(currentUserEmail))
            {
                return Unauthorized("Không tìm thấy thông tin người dùng trong Token.");
            }

            var msgType = (MessageType)type;
            var query = _context.Messages.AsQueryable();

            switch (msgType)
            {
                case MessageType.General:
                    query = query.Where(m => m.Type == MessageType.General);
                    break;

                case MessageType.Department:
                    if (string.IsNullOrEmpty(receiverId)) return BadRequest("Thiếu ID phòng ban.");
                    query = query.Where(m => m.Type == MessageType.Department && m.ReceiverId == receiverId);
                    break;

                case MessageType.Private:
                    if (string.IsNullOrEmpty(receiverId)) return BadRequest("Thiếu Email người nhận.");

                    query = query.Where(m => m.Type == MessageType.Private &&
                                            ((m.SenderEmail == currentUserEmail && m.ReceiverId == receiverId) ||
                                             (m.SenderEmail == receiverId && m.ReceiverId == currentUserEmail)));
                    break;
            }

            var messages = await query
                .OrderBy(m => m.Timestamp)
                .Select(m => new {
                    id = m.Id,
                    user = m.SenderEmail,
                    message = m.Content,
                    time = m.Timestamp,
                    receiver = m.ReceiverId,
                    type = (int)m.Type,
                    reactions = m.Reactions,
                    isMe = m.SenderEmail == currentUserEmail
                }).ToListAsync();

            return Ok(messages);
        }
    }
}