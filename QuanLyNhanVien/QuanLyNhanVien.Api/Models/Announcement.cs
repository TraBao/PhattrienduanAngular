using System;
using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public class Announcement
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Content { get; set; }

        public bool IsImportant { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}