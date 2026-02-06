// Models/Department.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // Thêm cái này
using System.Text.Json.Serialization;

namespace QuanLyNhanVien.Api.Models
{
    public class Department
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }
        public int? ManagerId { get; set; }

        [ForeignKey("ManagerId")]
        public Employee? Manager { get; set; }

        [JsonIgnore]
        public ICollection<Employee>? Employees { get; set; }
    }
}