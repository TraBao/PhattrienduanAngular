// Models/Attendance.cs

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

        public string Status { get; set; } = "OnTime";

        public string? IpAddress { get; set; }

        public string? Note { get; set; }
        public double? CheckInLatitude { get; set; }
        public double? CheckInLongitude { get; set; }

        public string? CheckInSelfieUrl { get; set; }
    }
}