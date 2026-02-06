using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanLyNhanVien.Api.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = "System";

        [Required]
        [StringLength(500)]
        public string Message { get; set; }

        [StringLength(255)]
        public string? Link { get; set; }

        public string? SenderId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("SenderId")]
        public virtual ApplicationUser? Sender { get; set; }
    }
}