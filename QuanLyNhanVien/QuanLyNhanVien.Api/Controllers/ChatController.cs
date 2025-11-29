using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] string? receiver = null)
        {
            var query = _context.Messages.AsQueryable();

            if (string.IsNullOrEmpty(receiver))
            {
                query = query.Where(m => string.IsNullOrEmpty(m.ReceiverEmail));
            }
            else
            {
                query = query.Where(m => m.ReceiverEmail == receiver);
            }

            var messages = await query
                .OrderBy(m => m.Timestamp)
                .Select(m => new
                {
                    user = m.SenderEmail,
                    message = m.Content,
                    time = m.Timestamp,
                    receiver = m.ReceiverEmail
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}