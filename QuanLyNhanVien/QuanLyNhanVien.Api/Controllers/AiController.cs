using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using QuanLyNhanVien.Api.Models;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiController : ControllerBase
    {
        private const string ApiKey = "AIzaSyCcNOXBwsOoayo3WyeVAu7xaiRvt5OoEAs";
        private const string ApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        [HttpPost("ask")]
        public async Task<IActionResult> AskAi([FromBody] AiRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Prompt)) return BadRequest("Vui lòng nhập câu hỏi.");
                string companyContext = @"
            BẠN LÀ TRỢ LÝ ẢO CỦA HỆ THỐNG QUẢN LÝ NHÂN SỰ (HRM).
            Hãy trả lời dựa trên các quy định sau:
            - Giờ làm việc: 8:00 sáng đến 17:00 chiều (Thứ 2 đến Thứ 6).
            - Quy định đi muộn: Check-in sau 8:15 bị tính là đi muộn.
            - Chính sách nghỉ phép: Nhân viên chính thức có 12 ngày phép/năm.
            - Lương thưởng: Lương được chi trả vào ngày 5 hàng tháng qua chuyển khoản.
            - Bảo hiểm: Công ty đóng full BHXH cho nhân viên ký HĐLĐ trên 6 tháng.
            
            LƯU Ý: Trả lời ngắn gọn, thân thiện, xưng hô là 'mình' hoặc 'hệ thống'.
        ";
                string userContext = $"Người đang hỏi bạn là: {request.UserName ?? "Ẩn danh"} - Chức vụ: {request.Role ?? "Nhân viên"}";
                string finalPrompt = $@"
            {companyContext}
            {userContext}
            --------------------------------
            Câu hỏi: {request.Prompt}
        ";

                using var client = new HttpClient();
                var payload = new
                {
                    contents = new[]
                    {
                new { parts = new[] { new { text = finalPrompt } } }
            }
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await client.PostAsync($"{ApiUrl}?key={ApiKey}", jsonContent);
                var responseString = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"Status: {response.StatusCode}");

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error: {responseString}");
                    return StatusCode((int)response.StatusCode, responseString);
                }

                var jsonNode = JsonNode.Parse(responseString);
                string aiAnswer = jsonNode?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

                return Ok(new AiResponse { Answer = aiAnswer ?? "AI không trả lời được." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SERVER ERROR: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }
    }
}