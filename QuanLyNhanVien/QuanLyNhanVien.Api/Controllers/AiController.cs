using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string ApiKey = "AIzaSyAgkSxWnbex_unAxDkF96FUU4uQ90ebBdA";
        private const string ApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        public AiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskAi([FromBody] AiRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Prompt)) return BadRequest("Vui lòng nhập câu hỏi.");
                var totalEmployees = await _context.Employees.CountAsync();
                var pendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == "Pending");
                var todayLates = await _context.Attendances
                    .CountAsync(a => a.Date == DateTime.Today && a.Status.Contains("Late"));
                var totalSalary = await _context.Payrolls
                    .Where(p => p.Month == DateTime.Now.Month && p.Year == DateTime.Now.Year)
                    .SumAsync(p => p.NetSalary);

                string systemData = $@"
                    DỮ LIỆU HỆ THỐNG THỜI GIAN THỰC:
                    - Tổng số nhân viên: {totalEmployees}
                    - Đơn nghỉ phép đang chờ duyệt: {pendingLeaves}
                    - Số người đi muộn hôm nay: {todayLates}
                    - Tổng quỹ lương tháng {DateTime.Now.Month}: {totalSalary:N0} VNĐ
                ";

                string companyContext = @"
                    BẠN LÀ TRỢ LÝ ẢO HRM THÔNG MINH.
                    Quy định: Làm từ 8h-17h. Đi muộn sau 8h15. 12 ngày phép/năm.
                    Lương trả ngày 5 hàng tháng.
                ";

                string finalPrompt = $@"
                    {companyContext}
                    {systemData}
                    Người hỏi: {request.UserName} (Quyền: {request.Role})
                    Câu hỏi: {request.Prompt}
                    Lưu ý: Nếu người hỏi là Admin, hãy cho phép họ biết các số liệu hệ thống. Nếu là Nhân viên, chỉ trả lời quy định chung.
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
    }

    public class AiRequest
    {
        public string Prompt { get; set; } = "";
        public string? UserName { get; set; }
        public string? Role { get; set; }
    }
}