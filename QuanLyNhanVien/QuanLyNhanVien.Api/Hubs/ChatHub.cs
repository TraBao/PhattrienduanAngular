using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        private static readonly Dictionary<string, string> _userCurrentRoom = new();

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }
        public override async Task OnConnectedAsync()
        {
            var email = Context.User?.FindFirst(ClaimTypes.Name)?.Value
                        ?? Context.User?.FindFirst(ClaimTypes.Email)?.Value;

            if (!string.IsNullOrEmpty(email))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{email}");
            }
            await base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userCurrentRoom.ContainsKey(Context.ConnectionId))
            {
                _userCurrentRoom.Remove(Context.ConnectionId);
            }
            return base.OnDisconnectedAsync(exception);
        }
        public async Task JoinChatRoom(string roomName)
        {
            var connectionId = Context.ConnectionId;
            if (_userCurrentRoom.TryGetValue(connectionId, out string? oldRoom))
            {
                await Groups.RemoveFromGroupAsync(connectionId, oldRoom);
            }
            await Groups.AddToGroupAsync(connectionId, roomName);
            if (_userCurrentRoom.ContainsKey(connectionId))
                _userCurrentRoom[connectionId] = roomName;
            else
                _userCurrentRoom.Add(connectionId, roomName);
        }
        public async Task SendMessage(string message, string? receiverId, int type)
        {
            var senderEmail = Context.User?.FindFirst(ClaimTypes.Name)?.Value
                              ?? Context.User?.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(senderEmail)) return;

            var msgType = (MessageType)type;
            var msg = new Message
            {
                SenderEmail = senderEmail,
                Content = message,
                Timestamp = DateTime.Now,
                ReceiverId = receiverId,
                Type = msgType
            };
            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();
            switch (msgType)
            {
                case MessageType.General:
                    await Clients.Group("General").SendAsync("ReceiveMessage", senderEmail, message, msg.Timestamp, null, (int)MessageType.General);
                    break;

                case MessageType.Department:
                    await Clients.Group($"Dept_{receiverId}").SendAsync("ReceiveMessage", senderEmail, message, msg.Timestamp, receiverId, (int)MessageType.Department);
                    break;

                case MessageType.Private:
                    await Clients.Group($"User_{receiverId}").SendAsync("ReceiveMessage", senderEmail, message, msg.Timestamp, receiverId, (int)MessageType.Private);
                    await Clients.Group($"User_{senderEmail}").SendAsync("ReceiveMessage", senderEmail, message, msg.Timestamp, receiverId, (int)MessageType.Private);
                    break;
            }
        }
        public async Task SendReaction(int messageId, string emoji, string clientSideEmail)
        {
            var senderEmail = Context.User?.FindFirst(ClaimTypes.Name)?.Value
                              ?? Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(senderEmail)) senderEmail = clientSideEmail;

            var msg = await _context.Messages.FindAsync(messageId);
            if (msg != null)
            {
                msg.Reactions = emoji;
                await _context.SaveChangesAsync();
                if (msg.Type == MessageType.General)
                {
                    await Clients.Group("General").SendAsync("ReceiveReaction", messageId, emoji, senderEmail);
                }
                else if (msg.Type == MessageType.Department)
                {
                    await Clients.Group($"Dept_{msg.ReceiverId}").SendAsync("ReceiveReaction", messageId, emoji, senderEmail);
                }
                else if (msg.Type == MessageType.Private)
                {
                    await Clients.Group($"User_{msg.ReceiverId}").SendAsync("ReceiveReaction", messageId, emoji, senderEmail);
                    await Clients.Group($"User_{msg.SenderEmail}").SendAsync("ReceiveReaction", messageId, emoji, senderEmail);
                }
            }
        }
    }
}