using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using QuanLyNhanVien.Api.Models.AuthDtos;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "User");
                return Ok(new { Message = "Đăng ký thành công! Vai trò: User" });
            }

            return BadRequest(new { Message = "Đăng ký thất bại", Errors = result.Errors });
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
                var roles = await _userManager.GetRolesAsync(user);
                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Email!),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                };

                foreach (var userRole in roles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, userRole));
                }
                if (!string.IsNullOrEmpty(user.Permissions))
                {
                    authClaims.Add(new Claim("permissions", user.Permissions));
                }

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

                var token = new JwtSecurityToken(
                    issuer: _configuration["Jwt:Issuer"],
                    audience: _configuration["Jwt:Audience"],
                    expires: DateTime.Now.AddHours(3),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );
                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    expiration = token.ValidTo
                });
            }
            return Unauthorized(new { Message = "Email hoặc mật khẩu không đúng." });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new
                {
                    user.Id,
                    user.Email,
                    Roles = roles,
                    Permissions = user.Permissions // Trả về quyền để Admin thấy
                });
            }

            return Ok(userList);
        }

        [HttpPost("assign-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignRole([FromBody] UserRoleDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return NotFound(new { Message = "Không tìm thấy user này." });
            }
            var currentRoles = await _userManager.GetRolesAsync(user);
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return BadRequest(new { Message = "Lỗi khi xóa quyền cũ." });
            }
            var addResult = await _userManager.AddToRolesAsync(user, model.Roles);
            if (!addResult.Succeeded)
            {
                return BadRequest(new { Message = "Lỗi khi thêm quyền mới." });
            }

            return Ok(new { Message = "Cập nhật quyền thành công!" });
        }
        [HttpPut("{id}/permissions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePermissions(string id, [FromBody] UpdatePermissionsDto model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound(new { Message = "Không tìm thấy user." });

            user.Permissions = model.Permissions;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded) return Ok(new { Message = "Cập nhật quyền thành công!" });

            return BadRequest(new { Message = "Lỗi khi cập nhật quyền." });
        }
    }

    public class UserRoleDto
    {
        public string Email { get; set; }
        public string[] Roles { get; set; }
    }
    public class UpdatePermissionsDto
    {
        public string Permissions { get; set; }
    }
}