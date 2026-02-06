using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Filters
{
    public class LogActivityAttribute : TypeFilterAttribute
    {
        public LogActivityAttribute(string description = "")
            : base(typeof(LogActivityFilter))
        {
            Arguments = new object[] { description };
        }
    }

    public class LogActivityFilter : IAsyncActionFilter
    {
        private readonly AppDbContext _context;
        private readonly string _description;

        public LogActivityFilter(AppDbContext context, string description)
        {
            _context = context;
            _description = description;
        }

        public async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next)
        {
            var result = await next();

            if (result.Exception != null) return;

            if (result.Result is ObjectResult obj &&
                obj.StatusCode >= 200 && obj.StatusCode < 300)
            {
                try
                {
                    var user = context.HttpContext.User;
                    var email = user.FindFirstValue(ClaimTypes.Email)
                                ?? user.Identity?.Name
                                ?? "Anonymous";

                    var activity = new SystemActivity
                    {
                        Username = email,
                        Method = context.HttpContext.Request.Method,
                        Path = context.HttpContext.Request.Path,
                        Description = string.IsNullOrEmpty(_description)
                            ? $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}"
                            : _description,
                        IpAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString(),
                        ActionDate = DateTime.Now
                    };

                    _context.SystemActivities.Add(activity);
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // tránh crash API
                }
            }
        }
    }
}
