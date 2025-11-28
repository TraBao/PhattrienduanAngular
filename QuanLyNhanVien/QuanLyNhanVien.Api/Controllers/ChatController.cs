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
        public async Task<IActionResult> GetHistory()
        {
            var messages = await _context.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new
                {
                    user = m.SenderEmail,
                    message = m.Content,
                    time = m.Timestamp
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}