using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using QuanLyNhanVien.Api.Filters;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public EmployeesController(AppDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult> GetEmployees([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var currentUserEmail = GetCurrentUserEmail();
            var currentUser = await _context.Employees.FirstOrDefaultAsync(e => e.Email == currentUserEmail);

            var managedDepartmentId = await _context.Departments
                .Where(d => d.ManagerId == currentUser.Id)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            var query = _context.Employees.AsQueryable();

            if (IsAdmin() || HasPermission("MANAGE_EMPLOYEES"))
            {
            }
            else if (managedDepartmentId > 0)
            {
                query = query.Where(e => e.DepartmentId == managedDepartmentId);
            }
            else
            {
                return Forbid();
            }

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
            var resultData = new List<object>();

            foreach (var emp in employees)
            {
                var user = await _userManager.FindByEmailAsync(emp.Email);
                bool isLocked = user != null && await _userManager.IsLockedOutAsync(user);
                string userId = user != null ? user.Id : "";
                resultData.Add(new
                {
                    Employee = emp,
                    IsLocked = isLocked,
                    UserId = userId
                });
            }

            return Ok(new
            {
                TotalItems = totalItems,
                Data = resultData,
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
        [LogActivity("Thêm mới hồ sơ nhân viên")]
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
        [LogActivity("Cập nhật thông tin nhân viên")]
        public async Task<IActionResult> PutEmployee(int id, Employee employee)
        {
            if (id != employee.Id) return BadRequest(new { Message = "Dữ liệu không hợp lệ." });

            var requesterEmail = GetCurrentUserEmail();
            Console.WriteLine($"[DEBUG] Requester Email: {requesterEmail}"); // LOG 1

            if (string.IsNullOrEmpty(requesterEmail)) return Unauthorized();

            var requesterProfile = await _context.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Email == requesterEmail);

            if (requesterProfile == null)
            {
                Console.WriteLine($"[DEBUG] Không tìm thấy profile nhân viên cho email: {requesterEmail}"); // LOG 2
                return Forbid("Tài khoản của bạn chưa liên kết với hồ sơ nhân viên.");
            }

            Console.WriteLine($"[DEBUG] Requester ID: {requesterProfile.Id}"); // LOG 3

            bool requesterIsAdmin = IsAdmin();
            bool requesterHasPerm = HasPermission("MANAGE_EMPLOYEES");

            var managedDepartmentId = await _context.Departments
                .Where(d => d.ManagerId == requesterProfile.Id)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            bool requesterIsManager = managedDepartmentId > 0;
            Console.WriteLine($"[DEBUG] IsAdmin: {requesterIsAdmin}, IsManager: {requesterIsManager}, ManagedDeptId: {managedDepartmentId}"); // LOG 4

            if (!requesterIsAdmin && !requesterHasPerm && !requesterIsManager)
            {
                Console.WriteLine("[DEBUG] Bị chặn ở bước kiểm tra quyền chung."); // LOG 5
                return Forbid();
            }

            var targetEmployeeInDb = await _context.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
            if (targetEmployeeInDb == null) return NotFound(new { Message = "Không tìm thấy nhân viên cần sửa." });

            Console.WriteLine($"[DEBUG] Target Employee DeptId: {targetEmployeeInDb.DepartmentId}"); // LOG 6

            if (!requesterIsAdmin)
            {
                if (targetEmployeeInDb.DepartmentId != managedDepartmentId)
                {
                    Console.WriteLine($"[DEBUG] Sai phòng ban. Target Dept: {targetEmployeeInDb.DepartmentId}, Managed Dept: {managedDepartmentId}"); // LOG 7
                    return Forbid("Bạn chỉ có quyền chỉnh sửa nhân viên thuộc phòng ban của mình.");
                }

                var targetUserAccount = await _userManager.FindByEmailAsync(targetEmployeeInDb.Email);
                if (targetUserAccount != null)
                {
                    var targetRoles = await _userManager.GetRolesAsync(targetUserAccount);
                    if (targetRoles.Contains("Admin"))
                    {
                        Console.WriteLine("[DEBUG] Đang cố sửa Admin."); // LOG 8
                        return Forbid("Bạn không có quyền chỉnh sửa hồ sơ của Quản trị viên (Admin).");
                    }
                }

                if (employee.DepartmentId != managedDepartmentId)
                {
                    return BadRequest(new { Message = "Bạn không thể chuyển nhân viên sang phòng ban khác." });
                }
            }

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

            return Ok(new { Message = "Cập nhật hồ sơ thành công." });
        }

        [HttpDelete("{id}")]
        [LogActivity("Xóa nhân viên khỏi hệ thống")]
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
        [HttpPut("{id}/workmode")]
        [LogActivity("Cập nhật chế độ làm việc của nhân viên")]
        public async Task<IActionResult> UpdateWorkMode(int id, [FromBody] WorkModeUpdateRequest request)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_EMPLOYEES"))
            {
                return Forbid();
            }

            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { Message = "Không tìm thấy nhân viên." });
            }

            employee.WorkMode = request.WorkMode;
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

            return Ok(new { Message = "Cập nhật chế độ làm việc thành công." });
        }

        [HttpPost("upload-avatar")]
        [LogActivity("Cập nhật ảnh đại diện nhân viên")]
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
        public class WorkModeUpdateRequest
        {
            [Required]
            public string WorkMode { get; set; }
        }
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
