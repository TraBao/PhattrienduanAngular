using System;

namespace QuanLyNhanVien.Api.Models
{
    public class CreateLeaveRequestDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; }
    }
    public class UpdateLeaveStatusDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; }
        public string? AdminComment { get; set; }
    }
}