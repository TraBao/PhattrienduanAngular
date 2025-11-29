namespace QuanLyNhanVien.Api.Models
{
    public class AiRequest
    {
        public string Prompt { get; set; }
        public string? UserName { get; set; }
        public string? Role { get; set; }
    }

    public class AiResponse
    {
        public string Answer { get; set; }
    }
}