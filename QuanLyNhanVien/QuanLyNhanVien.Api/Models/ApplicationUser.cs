using Microsoft.AspNetCore.Identity;

namespace QuanLyNhanVien.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? Permissions { get; set; }
    }
}