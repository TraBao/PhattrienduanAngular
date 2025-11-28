using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models.AuthDtos
{
    public class RegisterDto
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}