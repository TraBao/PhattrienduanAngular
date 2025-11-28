using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.IO;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public DocumentsController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }
        [HttpPost("upload/{employeeId}")]
        public async Task<IActionResult> UploadFile(int employeeId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file.");
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null) return NotFound("Nhân viên không tồn tại.");
            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }
            string uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }
            var document = new EmployeeDocument
            {
                EmployeeId = employeeId,
                FileName = file.FileName,
                FilePath = uniqueFileName,
                ContentType = file.ContentType,
                FileSize = file.Length
            };

            _context.EmployeeDocuments.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Upload thành công!", Data = document });
        }
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetDocuments(int employeeId)
        {
            var docs = await _context.EmployeeDocuments
                                     .Where(d => d.EmployeeId == employeeId)
                                     .OrderByDescending(d => d.UploadedAt)
                                     .ToListAsync();
            return Ok(docs);
        }
        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            var doc = await _context.EmployeeDocuments.FindAsync(id);
            if (doc == null) return NotFound("File không tồn tại trong DB.");

            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads");
            string filePath = Path.Combine(uploadsFolder, doc.FilePath);

            if (!System.IO.File.Exists(filePath))
                return NotFound("File không tồn tại trên server.");

            var memory = new MemoryStream();
            using (var stream = new FileStream(filePath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            return File(memory, doc.ContentType, doc.FileName);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFile(int id)
        {
            var doc = await _context.EmployeeDocuments.FindAsync(id);
            if (doc == null) return NotFound();
            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads");
            string filePath = Path.Combine(uploadsFolder, doc.FilePath);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
            _context.EmployeeDocuments.Remove(doc);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa file." });
        }
    }
}