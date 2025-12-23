namespace QuanLyNhanVien.Api.Dtos
{
    public class PayrollCalculationRequestDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public List<EmployeePayrollInputDto> EmployeeInputs { get; set; } = new List<EmployeePayrollInputDto>();
    }

    public class EmployeePayrollInputDto
    {
        public int EmployeeId { get; set; }
        public decimal OvertimeHours { get; set; } = 0;
        public decimal AllowancesAmount { get; set; } = 0;
        public decimal BonusesAmount { get; set; } = 0;
    }
}