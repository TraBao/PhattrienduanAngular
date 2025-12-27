using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string ApiKey = "AIzaSyCvkwyeoHBCJuJ_wx9-GdHZIylBschhwnE";
        private const string ApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        public AiController(AppDbContext context)
        {
            _context = context;
        }
        private string GetCurrentUserEmail() => User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        private bool IsCurrentUserAdmin() => User.IsInRole("Admin");


        [HttpPost("ask")]
        [AllowAnonymous]
        public async Task<IActionResult> AskAi([FromBody] AiRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Prompt)) return BadRequest("Vui lòng nhập câu hỏi.");

                var userEmail = GetCurrentUserEmail();
                string dynamicContext = await DetectIntentAndGetDataAsync(request.Prompt, userEmail);
                string companyContext = @"
                    BẠN LÀ TRỢ LÝ ẢO HRM THÔNG MINH, TÊN LÀ GEMINI.
                    Quy định chung: Giờ làm việc từ 8h-17h30, nghỉ trưa 12h-13h30. Đi muộn sau 8h15.
                    Mỗi nhân viên có 12 ngày phép/năm. Lương được thanh toán vào ngày 5 hàng tháng.
                    Hãy trả lời một cách thân thiện, chuyên nghiệp và ngắn gọn.
                ";

                string finalPrompt = $@"
                    {companyContext}
                    ---
                    DỮ LIỆU BỔ SUNG TỪ HỆ THỐNG:
                    {dynamicContext}
                    ---
                    Người hỏi: {userEmail}
                    Câu hỏi: ""{request.Prompt}""
                    
                    DỰA VÀO DỮ LIỆU TRÊN, HÃY TRẢ LỜI CÂU HỎI. Nếu dữ liệu không đủ, hãy nói rằng bạn không có thông tin.
                ";
                using var client = new HttpClient();
                var payload = new { contents = new[] { new { parts = new[] { new { text = finalPrompt } } } } };
                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await client.PostAsync($"{ApiUrl}?key={ApiKey}", jsonContent);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, responseString);

                var jsonNode = JsonNode.Parse(responseString);
                string aiAnswer = jsonNode?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

                return Ok(new { Answer = aiAnswer ?? "Mình đang suy nghĩ, bạn hỏi lại nhé!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        private async Task<string> DetectIntentAndGetDataAsync(string prompt, string userEmail)
        {
            var lowerPrompt = prompt.ToLower();
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == userEmail);
            if (employee == null) return "Lỗi: Không tìm thấy hồ sơ nhân viên cho người hỏi.";
            if (lowerPrompt.Contains("lương"))
            {
                int month = DateTime.Now.Month;
                for (int i = 1; i <= 12; i++)
                {
                    if (lowerPrompt.Contains($"tháng {i}"))
                    {
                        month = i;
                        break;
                    }
                }

                var payroll = await _context.Payrolls
                    .Where(p => p.EmployeeId == employee.Id && p.Month == month)
                    .OrderByDescending(p => p.Year)
                    .FirstOrDefaultAsync();

                if (payroll != null)
                {
                    return $"Thông tin lương tháng {month} của nhân viên {userEmail}: Lương Gross {payroll.GrossSalary:N0}đ, Tổng khấu trừ {payroll.TotalDeductions:N0}đ, Thực lĩnh {payroll.NetSalary:N0}đ.";
                }
                return $"Không tìm thấy dữ liệu lương tháng {month} của bạn trong hệ thống.";
            }
            if (lowerPrompt.Contains("nghỉ phép") || lowerPrompt.Contains("nghỉ ốm"))
            {
                var leaveRequests = await _context.LeaveRequests
                    .Where(l => l.EmployeeId == employee.Id && l.StartDate.Year == DateTime.Now.Year)
                    .ToListAsync();
                int annualUsed = (int)leaveRequests.Where(l => l.LeaveType == "Annual" && l.Status == "Approved").Sum(l => l.TotalDays);
                int annualBalance = 12 - annualUsed;

                return $"Thông tin nghỉ phép năm {DateTime.Now.Year} của bạn: Đã nghỉ {annualUsed} ngày, còn lại {annualBalance} ngày.";
            }
            if (lowerPrompt.Contains("email của") || lowerPrompt.Contains("số điện thoại của"))
            {
                var colleague = await _context.Employees.FirstOrDefaultAsync(e => lowerPrompt.Contains(e.FirstName.ToLower()) || lowerPrompt.Contains(e.LastName.ToLower()));
                if (colleague != null)
                {
                    return $"Thông tin của {colleague.LastName} {colleague.FirstName}: Email là {colleague.Email}, SĐT là {colleague.PhoneNumber ?? "chưa có"}.";
                }
            }
            if (IsCurrentUserAdmin())
            {
                var totalEmployees = await _context.Employees.CountAsync();
                var pendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == "Pending");
                return $"Dữ liệu hệ thống: Tổng nhân viên: {totalEmployees}, Đơn nghỉ phép chờ duyệt: {pendingLeaves}.";
            }

            return "Không có dữ liệu cụ thể. Chỉ trả lời dựa trên quy định chung.";
        }
    }
    public class AiRequest
    {
        public string Prompt { get; set; } = "";
        public string? UserName { get; set; }
        public string? Role { get; set; }
    }
}