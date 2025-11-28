using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanLyNhanVien.Api.Models
{
    public class EmployeeDocument
    {
        [Key]
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        [Required]
        public string FileName { get; set; }

        public string FilePath { get; set; }

        public string ContentType { get; set; }

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}