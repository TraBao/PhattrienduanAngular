using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public enum MessageType
    {
        General = 0,
        Department = 1,
        Private = 2
    }

    public class Message
    {
        [Key]
        public int Id { get; set; }
        public string SenderEmail { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string? ReceiverId { get; set; }

        public MessageType Type { get; set; } = MessageType.General;
        public string? Reactions { get; set; }
    }
}