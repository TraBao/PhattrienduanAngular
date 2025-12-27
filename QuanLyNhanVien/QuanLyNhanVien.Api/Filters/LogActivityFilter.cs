using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Filters
{
    public class LogActivityAttribute : TypeFilterAttribute
    {
        public LogActivityAttribute(string description = "") : base(typeof(LogActivityFilter))
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

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var resultContext = await next();
            if (resultContext.Exception == null &&
                resultContext.Result is ObjectResult result &&
                result.StatusCode >= 200 && result.StatusCode < 300)
            {
                try
                {
                    var userEmail = context.HttpContext.User.FindFirstValue(ClaimTypes.Name) ?? "Anonymous";
                    var ip = context.HttpContext.Connection.RemoteIpAddress?.ToString();
                    var activity = new SystemActivity
                    {
                        Username = userEmail,
                        Method = context.HttpContext.Request.Method,
                        Path = context.HttpContext.Request.Path,
                        Description = string.IsNullOrEmpty(_description) ? $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}" : _description,
                        IpAddress = ip,
                        ActionDate = DateTime.Now
                    };

                    _context.SystemActivities.Add(activity);
                    await _context.SaveChangesAsync();
                }
                catch
                {
                }
            }
        }
    }
}