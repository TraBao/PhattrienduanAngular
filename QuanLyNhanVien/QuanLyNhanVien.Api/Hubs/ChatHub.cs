using Microsoft.AspNetCore.SignalR;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;

namespace QuanLyNhanVien.Api.Hubs
{
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        public ChatHub(AppDbContext context) { _context = context; }

        public async Task SendMessage(string user, string message)
        {
            var msg = new Message { SenderEmail = user, Content = message, Timestamp = DateTime.Now };
            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();
            await Clients.All.SendAsync("ReceiveMessage", user, message, msg.Timestamp);
        }
    }
}