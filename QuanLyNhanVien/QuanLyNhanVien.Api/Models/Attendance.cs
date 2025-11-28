using System;
using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public class Attendance
    {
        [Key]
        public int Id { get; set; }

        public string UserId { get; set; }

        public DateTime Date { get; set; }

        public DateTime CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        public double? TotalHours { get; set; }
    }
}