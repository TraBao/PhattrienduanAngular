using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;

namespace QuanLyNhanVien.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task SendMessage(string user, string message, string? receiver = null)
        {
            var msg = new Message
            {
                SenderEmail = user,
                Content = message,
                Timestamp = DateTime.Now,
                ReceiverEmail = receiver ?? ""
            };

            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();
            if (string.IsNullOrEmpty(receiver))
            {
                await Clients.All.SendAsync("ReceiveMessage", user, message, msg.Timestamp, null);
            }
            else
            {
                await Clients.Group(receiver).SendAsync("ReceiveMessage", user, message, msg.Timestamp, receiver);
            }
        }
    }
}