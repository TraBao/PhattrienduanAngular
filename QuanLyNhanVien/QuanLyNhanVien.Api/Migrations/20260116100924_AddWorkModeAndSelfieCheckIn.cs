using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuanLyNhanVien.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkModeAndSelfieCheckIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WorkMode",
                table: "Employees",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CheckInSelfieUrl",
                table: "Attendances",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                column: "WorkMode",
                value: "Onsite");

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 2,
                column: "WorkMode",
                value: "Onsite");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WorkMode",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CheckInSelfieUrl",
                table: "Attendances");
        }
    }
}
