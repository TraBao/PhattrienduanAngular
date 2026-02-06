// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace QuanLyNhanVien.Api.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<EmployeeDocument> EmployeeDocuments { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Payroll> Payrolls { get; set; }
        public DbSet<FormTemplate> FormTemplates { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SystemActivity> SystemActivities { get; set; }
        public DbSet<Meeting> Meetings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Employee>().Property(e => e.Salary).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.BasicSalary).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.OvertimePay).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.Allowances).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.Bonuses).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.GrossSalary).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.SocialInsuranceDeduction).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.HealthInsuranceDeduction).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.UnemploymentInsuranceDeduction).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.PersonalIncomeTaxDeduction).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.TotalDeductions).HasColumnType("decimal(18, 2)");
            modelBuilder.Entity<Payroll>().Property(p => p.NetSalary).HasColumnType("decimal(18, 2)");

            modelBuilder.Entity<Department>()
                .HasOne(d => d.Manager)
                .WithMany()
                .HasForeignKey(d => d.ManagerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Phòng Kỹ thuật", Description = "Chịu trách nhiệm về công nghệ và hạ tầng" },
                new Department { Id = 2, Name = "Phòng Nhân sự", Description = "Tuyển dụng và quản lý nhân viên" },
                new Department { Id = 3, Name = "Phòng Kinh doanh", Description = "Tìm kiếm khách hàng và bán sản phẩm" }
            );

            modelBuilder.Entity<Employee>().HasData(
                new Employee
                {
                    Id = 1,
                    FirstName = "Văn",
                    LastName = "An",
                    Email = "an.van@example.com",
                    DateOfBirth = new DateTime(1990, 1, 15),
                    Salary = 60000.00m,
                    DepartmentId = 1
                },
                new Employee
                {
                    Id = 2,
                    FirstName = "Thị",
                    LastName = "Bình",
                    Email = "binh.thi@example.com",
                    DateOfBirth = new DateTime(1992, 5, 20),
                    Salary = 55000.00m,
                    DepartmentId = 2
                }
            );
        }
    }
}