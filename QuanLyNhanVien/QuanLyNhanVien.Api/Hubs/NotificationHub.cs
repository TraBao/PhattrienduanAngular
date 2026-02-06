using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace QuanLyNhanVien.Api.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
    }
}