using System;
using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RecipientIdentifier { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = "System";

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsRead { get; set; } = false;
    }
}