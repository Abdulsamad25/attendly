const Deduction = require("../models/Deduction");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { recalculateFromAttendance } = require("../utils/deductionCalculator");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

//  helpers

const currentPeriod = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

/**
 * Upsert a deduction record for a user in the current month.
 * Called by attendanceController whenever an absent/late event fires.
 */
const upsertDeduction = async (userId, companyId) => {
  const { month, year } = currentPeriod();

  const user = await User.findById(userId).select("salary");
  if (!user || !user.salary) return null;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    user_id: userId,
    company_id: companyId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  }).select("status");

  const breakdown = recalculateFromAttendance({
    monthlySalary: user.salary,
    attendanceRecords: records,
  });

  const deduction = await Deduction.findOneAndUpdate(
    { user_id: userId, company_id: companyId, month, year },
    {
      $set: {
        monthly_salary: user.salary,
        daily_rate: breakdown.dailyRate,
        absent_days: breakdown.absentDays,
        absent_amount: breakdown.absentAmount,
        late_count: breakdown.lateCount,
        late_units: breakdown.lateUnits,
        late_amount: breakdown.lateAmount,
        total_deduction: breakdown.totalDeduction,
      },
    },
    { upsert: true, new: true },
  );

  return deduction;
};

//  GET /deductions/me

const getMyDeductions = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 12 } = req.query;
    const filter = { user_id: req.user._id, company_id: req.user.company_id };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Deduction.countDocuments(filter);
    const docs = await Deduction.find(filter)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-monthly_salary -daily_rate -last_updated_by");

    res.json({
      success: true,
      data: docs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /deductions/current

const getMyCurrentDeduction = async (req, res) => {
  try {
    const { month, year } = currentPeriod();
    const doc = await Deduction.findOne({
      user_id: req.user._id,
      company_id: req.user.company_id,
      month,
      year,
    }).select("-monthly_salary -daily_rate -last_updated_by");

    res.json({
      success: true,
      data: doc || {
        month,
        year,
        absent_days: 0,
        absent_amount: 0,
        late_count: 0,
        late_units: 0,
        late_amount: 0,
        total_deduction: 0,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /deductions/all (admin)

const getAllDeductions = async (req, res) => {
  try {
    const {
      month,
      year,
      department,
      user_id,
      page = 1,
      limit = 20,
    } = req.query;
    const { month: curMonth, year: curYear } = currentPeriod();

    const filter = {
      company_id: req.user.company_id,
      month: parseInt(month || curMonth),
      year: parseInt(year || curYear),
    };
    if (user_id) filter.user_id = user_id;

    if (department) {
      const users = await User.find({
        company_id: req.user.company_id,
        department,
        status: "active",
      }).select("_id");
      filter.user_id = { $in: users.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Deduction.countDocuments(filter);
    const docs = await Deduction.find(filter)
      .sort({ total_deduction: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user_id", "name email department");

    res.json({
      success: true,
      data: docs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /deductions/summary (admin)

const getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { month: curMonth, year: curYear } = currentPeriod();
    const targetMonth = parseInt(month || curMonth);
    const targetYear = parseInt(year || curYear);

    const docs = await Deduction.find({
      company_id: req.user.company_id,
      month: targetMonth,
      year: targetYear,
    }).populate("user_id", "name email department salary");

    const rows = docs.map((d) => ({
      staff_id: d.user_id._id,
      name: d.user_id.name,
      email: d.user_id.email,
      department: d.user_id.department,
      monthly_salary: d.monthly_salary,
      absent_days: d.absent_days,
      absent_amount: d.absent_amount,
      late_count: d.late_count,
      late_units: d.late_units,
      late_amount: d.late_amount,
      total_deduction: d.total_deduction,
      net_pay: parseFloat((d.monthly_salary - d.total_deduction).toFixed(2)),
    }));

    const companyTotal = rows.reduce(
      (acc, r) => {
        acc.total_salary += r.monthly_salary;
        acc.total_deductions += r.total_deduction;
        acc.total_net_pay += r.net_pay;
        return acc;
      },
      { total_salary: 0, total_deductions: 0, total_net_pay: 0 },
    );

    res.json({
      success: true,
      period: { month: targetMonth, year: targetYear },
      summary: rows,
      totals: {
        total_salary: parseFloat(companyTotal.total_salary.toFixed(2)),
        total_deductions: parseFloat(companyTotal.total_deductions.toFixed(2)),
        total_net_pay: parseFloat(companyTotal.total_net_pay.toFixed(2)),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /deductions/export/excel (admin) 

const exportPayrollExcel = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { month: curMonth, year: curYear } = currentPeriod();
    const targetMonth = parseInt(month || curMonth);
    const targetYear = parseInt(year || curYear);

    const docs = await Deduction.find({
      company_id: req.user.company_id,
      month: targetMonth,
      year: targetYear,
    }).populate("user_id", "name email department salary");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Attendly";
    const sheet = workbook.addWorksheet(`Payroll ${targetMonth}-${targetYear}`);

    const headerFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    const headerFont = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      name: "Arial",
      size: 11,
    };

    sheet.columns = [
      { header: "Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Department", key: "department", width: 16 },
      { header: "Monthly Salary", key: "monthly_salary", width: 18 },
      { header: "Absent Days", key: "absent_days", width: 14 },
      { header: "Absence Deduction", key: "absent_amount", width: 20 },
      { header: "Late Count", key: "late_count", width: 12 },
      { header: "Late Deduction", key: "late_amount", width: 16 },
      { header: "Total Deduction", key: "total_deduction", width: 18 },
      { header: "Net Pay", key: "net_pay", width: 18 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    sheet.getRow(1).height = 28;

    docs.forEach((d, i) => {
      const netPay = parseFloat(
        (d.monthly_salary - d.total_deduction).toFixed(2),
      );
      const row = sheet.addRow({
        name: d.user_id.name,
        email: d.user_id.email,
        department: d.user_id.department,
        monthly_salary: d.monthly_salary,
        absent_days: d.absent_days,
        absent_amount: d.absent_amount,
        late_count: d.late_count,
        late_amount: d.late_amount,
        total_deduction: d.total_deduction,
        net_pay: netPay,
      });

      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEAF4FB" },
          };
        });
      }

      if (d.total_deduction > 0) {
        row.getCell("total_deduction").font = {
          color: { argb: "FFCC0000" },
          bold: true,
        };
        row.getCell("net_pay").font = {
          color: { argb: "FFCC0000" },
          bold: true,
        };
      }
    });

    const totalSalary = docs.reduce((a, d) => a + d.monthly_salary, 0);
    const totalDeductions = docs.reduce((a, d) => a + d.total_deduction, 0);
    const totalNetPay = totalSalary - totalDeductions;

    const totalsRow = sheet.addRow({
      name: "TOTALS",
      monthly_salary: parseFloat(totalSalary.toFixed(2)),
      total_deduction: parseFloat(totalDeductions.toFixed(2)),
      net_pay: parseFloat(totalNetPay.toFixed(2)),
    });
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Arial" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFE0B2" },
      };
    });

    [
      "monthly_salary",
      "absent_amount",
      "late_amount",
      "total_deduction",
      "net_pay",
    ].forEach((key) => {
      sheet.getColumn(key).numFmt = "₦#,##0.00";
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendly_payroll_${targetMonth}_${targetYear}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Export failed", error: err.message });
  }
};

//  GET /deductions/export/pdf (admin)

const exportPayrollPDF = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { month: curMonth, year: curYear } = currentPeriod();
    const targetMonth = parseInt(month || curMonth);
    const targetYear = parseInt(year || curYear);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const docs = await Deduction.find({
      company_id: req.user.company_id,
      month: targetMonth,
      year: targetYear,
    }).populate("user_id", "name email department salary");

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendly_payroll_${targetMonth}_${targetYear}.pdf"`,
    );
    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor("#1E3A5F")
      .text("Attendly — Payroll Deduction Report", { align: "center" });
    doc
      .fontSize(12)
      .fillColor("#888888")
      .text(`Period: ${monthNames[targetMonth - 1]} ${targetYear}`, {
        align: "center",
      });
    doc.moveDown();

    const colX = [40, 160, 260, 320, 390, 460, 530, 600, 680, 760];
    const colLabels = [
      "Name",
      "Email",
      "Dept",
      "Salary",
      "Absent",
      "Abs Deduct",
      "Lates",
      "Late Deduct",
      "Total Deduct",
      "Net Pay",
    ];

    doc.rect(40, doc.y, 770, 20).fill("#1E3A5F");
    doc.fontSize(9).fillColor("#FFFFFF");
    colLabels.forEach((label, i) =>
      doc.text(label, colX[i], doc.y - 16, {
        width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80,
      }),
    );
    doc.moveDown(0.5);

    let rowY = doc.y;
    docs.forEach((d, i) => {
      const netPay = parseFloat(
        (d.monthly_salary - d.total_deduction).toFixed(2),
      );
      const bg = i % 2 === 0 ? "#EAF4FB" : "#FFFFFF";
      doc.rect(40, rowY, 770, 18).fill(bg);
      doc.fontSize(8).fillColor("#333333");

      const values = [
        d.user_id.name.slice(0, 14),
        d.user_id.email.slice(0, 20),
        d.user_id.department,
        `₦${d.monthly_salary.toLocaleString()}`,
        d.absent_days,
        `₦${d.absent_amount.toFixed(2)}`,
        d.late_count,
        `₦${d.late_amount.toFixed(2)}`,
        `₦${d.total_deduction.toFixed(2)}`,
        `₦${netPay.toFixed(2)}`,
      ];
      values.forEach((val, ci) => {
        doc.text(String(val), colX[ci], rowY + 4, {
          width: colX[ci + 1] ? colX[ci + 1] - colX[ci] - 4 : 80,
        });
      });
      rowY += 18;
    });

    const totalSalary = docs.reduce((a, d) => a + d.monthly_salary, 0);
    const totalDeductions = docs.reduce((a, d) => a + d.total_deduction, 0);
    const totalNetPay = totalSalary - totalDeductions;

    doc.rect(40, rowY, 770, 20).fill("#FFE0B2");
    doc.fontSize(9).fillColor("#1E3A5F").font("Helvetica-Bold");
    doc.text("TOTALS", colX[0], rowY + 4);
    doc.text(`₦${totalSalary.toFixed(2)}`, colX[3], rowY + 4);
    doc.text(`₦${totalDeductions.toFixed(2)}`, colX[8], rowY + 4);
    doc.text(`₦${totalNetPay.toFixed(2)}`, colX[9], rowY + 4);

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#AAAAAA")
      .font("Helvetica")
      .text(`Generated by Attendly on ${new Date().toLocaleDateString()}`, {
        align: "right",
      });
    doc.end();
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "PDF export failed",
        error: err.message,
      });
  }
};

module.exports = {
  upsertDeduction,
  getMyDeductions,
  getMyCurrentDeduction,
  getAllDeductions,
  getMonthlySummary,
  exportPayrollExcel,
  exportPayrollPDF,
};
