using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace QuanLyNhanVien.Api.Controllers
{
    public class CheckInRequest
    {
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public IFormFile? Selfie { get; set; }
        public string? Note { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public AttendanceController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment env)
        {
            _context = context;
            _configuration = configuration;
            _env = env;
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetTodayStatus()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;
            var record = await _context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);
            return Ok(record);
        }

        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;
            var record = await _context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            if (record == null) return BadRequest(new { Message = "Chưa Check-in!" });
            if (record.CheckOutTime != null) return BadRequest(new { Message = "Đã Check-out rồi!" });

            record.CheckOutTime = DateTime.Now;
            TimeSpan duration = record.CheckOutTime.Value - record.CheckInTime;
            double totalHours = duration.TotalHours;
            if (record.CheckInTime.TimeOfDay < new TimeSpan(12, 0, 0) &&
                record.CheckOutTime.Value.TimeOfDay > new TimeSpan(13, 30, 0))
            {
                totalHours -= 1.5;
            }

            record.TotalHours = Math.Max(0, Math.Round(totalHours, 2));
            if (record.CheckOutTime.Value.TimeOfDay < new TimeSpan(17, 0, 0))
            {
                record.Status = record.Status == "Late" ? "Late & EarlyLeave" : "EarlyLeave";
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Check-out thành công!", Data = record });
        }

        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var history = await _context.Attendances
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Date)
                .Take(31)
                .ToListAsync();
            return Ok(history);
        }

        // 2. Sửa hàm CheckIn để nhận tham số qua class CheckInRequest
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromForm] CheckInRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;
            var now = DateTime.Now;

            // Kiểm tra các điều kiện chung
            if (await _context.Attendances.AnyAsync(a => a.UserId == userId && a.Date == today))
                return BadRequest(new { Message = "Bạn đã Check-in hôm nay rồi!" });

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == userId);
            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy thông tin nhân viên." });

            var isOnLeave = await _context.LeaveRequests.AnyAsync(l =>
                l.EmployeeId == employee.Id &&
                l.Status == "Approved" &&
                l.StartDate.Date <= today &&
                l.EndDate.Date >= today
            );
            if (isOnLeave)
                return BadRequest(new { Message = "Bạn đang trong kỳ nghỉ phép đã duyệt." });

            var attendance = new Attendance
            {
                UserId = userId,
                Date = today,
                CheckInTime = now,
                Status = now.TimeOfDay > new TimeSpan(8, 15, 0) ? "Late" : "OnTime",
                Note = request.Note, // Sửa thành request.Note
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            if (employee.WorkMode == "Remote")
            {
                // Sửa thành request.Selfie
                if (request.Selfie == null || request.Selfie.Length == 0)
                    return BadRequest(new { Message = "Vui lòng cung cấp ảnh selfie để chấm công." });

                // LƯU Ý QUAN TRỌNG: 
                // Nếu chạy trên IIS mà dùng thư mục ngoài wwwroot thì phải sửa đường dẫn ở đây.
                // Ở đây tôi giữ nguyên logic của bạn (dùng WebRootPath), 
                // nhưng nếu bạn lưu ảnh ở thư mục gốc thì dùng Directory.GetCurrentDirectory() thay vì _env.WebRootPath
                var uploadsFolder = Path.Combine(_env.ContentRootPath, "Uploads", "selfies");

                // Tôi đã đổi _env.WebRootPath thành _env.ContentRootPath để phù hợp với folder Uploads bạn tạo lúc deploy
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + request.Selfie.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.Selfie.CopyToAsync(stream);
                }
                attendance.CheckInSelfieUrl = $"/Uploads/selfies/{uniqueFileName}";
            }
            else
            {
                var officeLat = _configuration.GetValue<double>("OfficeLocationSettings:Latitude");
                var officeLon = _configuration.GetValue<double>("OfficeLocationSettings:Longitude");
                var allowedRadius = _configuration.GetValue<double>("OfficeLocationSettings:AllowedRadiusInMeters");

                // Sửa thành request.Latitude
                if (request.Latitude == null || request.Longitude == null)
                    return BadRequest(new { Message = "Không thể xác định vị trí của bạn." });

                var distance = CalculateDistance(officeLat, officeLon, request.Latitude.Value, request.Longitude.Value);
                if (distance > allowedRadius)
                    return BadRequest(new { Message = $"Bạn phải ở trong khu vực công ty để chấm công. Khoảng cách hiện tại: {distance:F0} mét." });

                attendance.CheckInLatitude = request.Latitude;
                attendance.CheckInLongitude = request.Longitude;
            }

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Check-in thành công!", Data = attendance });
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371e3;
            var phi1 = lat1 * Math.PI / 180;
            var phi2 = lat2 * Math.PI / 180;
            var deltaPhi = (lat2 - lat1) * Math.PI / 180;
            var deltaLambda = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(deltaPhi / 2) * Math.Sin(deltaPhi / 2) + Math.Cos(phi1) * Math.Cos(phi2) * Math.Sin(deltaLambda / 2) * Math.Sin(deltaLambda / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }
    }
}