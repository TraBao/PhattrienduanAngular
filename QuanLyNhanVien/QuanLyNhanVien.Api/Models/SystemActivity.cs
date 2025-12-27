using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public class SystemActivity
    {
        [Key]
        public int Id { get; set; }
        public string? Username { get; set; }
        public string Method { get; set; }
        public string Path { get; set; }
        public string? Description { get; set; }
        public string? IpAddress { get; set; }
        public DateTime ActionDate { get; set; } = DateTime.Now;
    }
}