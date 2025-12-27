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
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Filters;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration, AppDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
        }

        private string GetCurrentUserEmail() => User.FindFirstValue(ClaimTypes.Name);

        [HttpPost("Register")]
        [AllowAnonymous]
        [LogActivity("Đăng ký tài khoản mới")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
            user.LockoutEnabled = true;

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "User");
                return Ok(new { Message = "Đăng ký thành công! Vai trò: User" });
            }
            return BadRequest(new { Message = "Đăng ký thất bại", Errors = result.Errors });
        }

        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user != null && await _userManager.IsLockedOutAsync(user))
            {
                return Unauthorized(new { Message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
            }

            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await _userManager.ResetAccessFailedCountAsync(user);

                var roles = await _userManager.GetRolesAsync(user);
                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Email!),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                };
                foreach (var userRole in roles) { authClaims.Add(new Claim(ClaimTypes.Role, userRole)); }
                if (!string.IsNullOrEmpty(user.Permissions)) { authClaims.Add(new Claim("permissions", user.Permissions)); }

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
                var token = new JwtSecurityToken(
                    issuer: _configuration["Jwt:Issuer"],
                    audience: _configuration["Jwt:Audience"],
                    expires: DateTime.Now.AddHours(3),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );
                try
                {
                    _context.SystemActivities.Add(new SystemActivity
                    {
                        Username = user.Email,
                        Method = "POST",
                        Path = "/api/Auth/Login",
                        Description = "Đăng nhập hệ thống thành công",
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        ActionDate = DateTime.Now
                    });
                    await _context.SaveChangesAsync();
                }
                catch { }

                return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), expiration = token.ValidTo });
            }
            if (user != null)
            {
                await _userManager.AccessFailedAsync(user);
            }

            return Unauthorized(new { Message = "Email hoặc mật khẩu không đúng." });
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                bool isLocked = await _userManager.IsLockedOutAsync(user);

                userList.Add(new
                {
                    user.Id,
                    user.Email,
                    Roles = roles,
                    Permissions = user.Permissions,
                    LockoutEnd = user.LockoutEnd,
                    IsLocked = isLocked
                });
            }

            return Ok(userList);
        }

        [HttpPost("assign-role")]
        [Authorize(Roles = "Admin")]
        [LogActivity("Phân quyền vai trò (Role) cho người dùng")]
        public async Task<IActionResult> AssignRole([FromBody] UserRoleDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return NotFound(new { Message = "Không tìm thấy user này." });

            var adminEmail = GetCurrentUserEmail();
            if (user.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase) && !model.Roles.Contains("Admin"))
            {
                return BadRequest(new { Message = "Bạn không thể tự gỡ bỏ quyền Admin của chính mình." });
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRolesAsync(user, model.Roles);

            return Ok(new { Message = "Cập nhật quyền thành công!" });
        }

        [HttpPost("toggle-lock/{id}")]
        [Authorize(Roles = "Admin")]
        [LogActivity("Khóa/Mở khóa tài khoản")]
        public async Task<IActionResult> ToggleUserLock(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound("Không tìm thấy người dùng.");
            var adminEmail = GetCurrentUserEmail();
            if (user.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { Message = "Bạn không thể tự khóa tài khoản của chính mình." });
            }
            if (!user.LockoutEnabled)
            {
                user.LockoutEnabled = true;
                await _userManager.UpdateAsync(user);
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                await _userManager.SetLockoutEndDateAsync(user, null);
                return Ok(new { Message = "Đã mở khóa tài khoản thành công.", IsLocked = false });
            }
            else
            {
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
                return Ok(new { Message = "Đã khóa tài khoản thành công.", IsLocked = true });
            }
        }

        [HttpPut("{id}/permissions")]
        [Authorize(Roles = "Admin")]
        [LogActivity("Cập nhật quyền hạn chi tiết (Permissions)")]
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