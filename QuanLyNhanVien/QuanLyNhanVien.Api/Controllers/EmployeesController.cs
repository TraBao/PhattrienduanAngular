using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult> GetEmployees([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Employees.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(e => e.FirstName.Contains(search)
                                      || e.LastName.Contains(search)
                                      || e.Email.Contains(search));
            }

            var totalItems = await query.CountAsync();
            var employees = await query
                .OrderByDescending(e => e.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return Ok(new
            {
                TotalItems = totalItems,
                Data = employees,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return NotFound(new { Message = "Không tìm thấy nhân viên" });
            return Ok(employee);
        }
        [HttpPost]
        public async Task<ActionResult<Employee>> PostEmployee(Employee employee)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_EMPLOYEES")) return Forbid();

            if (await _context.Employees.AnyAsync(e => e.Email == employee.Email))
            {
                return BadRequest(new { Message = "Email này đã tồn tại trong hệ thống." });
            }

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetEmployee", new { id = employee.Id }, employee);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEmployee(int id, Employee employee)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_EMPLOYEES")) return Forbid();

            if (id != employee.Id) return BadRequest();
            _context.Entry(employee).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmployeeExists(id)) return NotFound();
                else throw;
            }
            return NoContent();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_EMPLOYEES")) return Forbid();

            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return NotFound();

            if (!string.IsNullOrEmpty(employee.AvatarUrl))
            {
                var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", employee.AvatarUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
            }

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var email = GetCurrentUserEmail();
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { Message = "Không tìm thấy thông tin định danh trong Token." });
            }

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == email);

            if (employee == null)
            {
                return NotFound(new { Message = "Tài khoản này chưa được liên kết với hồ sơ nhân viên." });
            }

            return Ok(employee);
        }
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] int employeeId, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng chọn file ảnh hợp lệ.");
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension)) return BadRequest("Chỉ cho phép tải lên các định dạng ảnh (.jpg, .png)");
            if (file.Length > 2 * 1024 * 1024) return BadRequest("Dung lượng ảnh không được vượt quá 2MB.");

            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null) return NotFound("Không tìm thấy nhân viên");
            var currentUserEmail = GetCurrentUserEmail();
            bool isManager = IsAdmin() || HasPermission("MANAGE_EMPLOYEES");
            bool isOwner = employee.Email?.ToLower() == currentUserEmail.ToLower();

            if (!isManager && !isOwner)
            {
                return Forbid("Bạn không có quyền thay đổi ảnh của người khác.");
            }

            try
            {
                if (!string.IsNullOrEmpty(employee.AvatarUrl))
                {
                    var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", employee.AvatarUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
                }
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
                if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                var filePath = Path.Combine(uploadPath, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                var relativePath = "/uploads/avatars/" + fileName;
                employee.AvatarUrl = relativePath;

                _context.Employees.Update(employee);
                await _context.SaveChangesAsync();

                return Ok(new { url = relativePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống khi xử lý ảnh: {ex.Message}");
            }
        }
        private bool EmployeeExists(int id) => _context.Employees.Any(e => e.Id == id);

        private bool IsAdmin() => User.IsInRole("Admin");

        private bool HasPermission(string p) => User.HasClaim(c => c.Type == "permissions" && c.Value.Contains(p));

        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue(ClaimTypes.Email)
                ?? User.FindFirstValue("email")
                ?? User.FindFirstValue("sub")
                ?? string.Empty;
        }
    }
}