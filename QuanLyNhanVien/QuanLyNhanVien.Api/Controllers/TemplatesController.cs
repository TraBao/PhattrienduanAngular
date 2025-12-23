using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TemplatesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public TemplatesController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }
        [HttpGet]
        public async Task<IActionResult> GetTemplates()
        {
            var items = await _context.FormTemplates
                                      .OrderByDescending(t => t.UploadedDate)
                                      .ToListAsync();
            return Ok(items);
        }
        [HttpPost]
        public async Task<IActionResult> UploadTemplate([FromForm] string title, [FromForm] string description, IFormFile file)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_DOCUMENTS")) return Forbid();

            if (file == null || file.Length == 0) return BadRequest("Vui lòng chọn file.");

            string folderName = Path.Combine("uploads", "templates");
            string uploadPath = Path.Combine(_environment.WebRootPath, folderName);

            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

            string uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            string fullPath = Path.Combine(uploadPath, uniqueName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var template = new FormTemplate
            {
                Title = title ?? file.FileName,
                Description = description,
                OriginalFileName = file.FileName,
                FileType = Path.GetExtension(file.FileName).ToLower(),
                FilePath = $"/{folderName}/{uniqueName}".Replace("\\", "/"),
                FileSize = file.Length
            };

            _context.FormTemplates.Add(template);
            await _context.SaveChangesAsync();

            return Ok(template);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_DOCUMENTS")) return Forbid();

            var template = await _context.FormTemplates.FindAsync(id);
            if (template == null) return NotFound();

            var physicalPath = Path.Combine(_environment.WebRootPath, template.FilePath.TrimStart('/'));
            if (System.IO.File.Exists(physicalPath))
            {
                System.IO.File.Delete(physicalPath);
            }

            _context.FormTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        private bool HasPermission(string permissionCode)
        {
            return User.HasClaim(c => c.Type == "permissions" && c.Value.Contains(permissionCode));
        }
    }
}