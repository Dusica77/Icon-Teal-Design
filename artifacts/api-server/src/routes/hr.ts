import { Router, type IRouter } from "express";
import { db, employeesTable, payrollsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateEmployeeBody, UpdateEmployeeBody, GetEmployeeParams, UpdateEmployeeParams, DeleteEmployeeParams,
  CreatePayrollBody,
  ListEmployeesResponse, GetEmployeeResponse, UpdateEmployeeResponse,
  ListPayrollsResponse, GetHrSummaryResponse,
} from "@workspace/api-zod";
import { count, sum, sql } from "drizzle-orm";

const router: IRouter = Router();

function mapEmployee(e: typeof employeesTable.$inferSelect) {
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    department: e.department,
    position: e.position,
    salary: parseFloat(e.salary),
    status: e.status,
    joinedAt: e.joinedAt,
    phone: e.phone ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

function mapPayroll(p: typeof payrollsTable.$inferSelect, employeeName?: string) {
  return {
    id: p.id,
    employeeId: p.employeeId,
    employeeName: employeeName ?? "Unknown",
    month: p.month,
    year: p.year,
    grossSalary: parseFloat(p.grossSalary),
    deductions: parseFloat(p.deductions),
    netSalary: parseFloat(p.netSalary),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/hr/employees", async (_req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.createdAt);
  res.json(ListEmployeesResponse.parse(employees.map(mapEmployee)));
});

router.post("/hr/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.insert(employeesTable).values(parsed.data).returning();
  res.status(201).json(GetEmployeeResponse.parse(mapEmployee(employee)));
});

router.get("/hr/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, params.data.id));
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(GetEmployeeResponse.parse(mapEmployee(employee)));
});

router.patch("/hr/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.update(employeesTable).set(parsed.data).where(eq(employeesTable.id, params.data.id)).returning();
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(UpdateEmployeeResponse.parse(mapEmployee(employee)));
});

router.delete("/hr/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [employee] = await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id)).returning();
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/hr/payrolls", async (_req, res): Promise<void> => {
  const payrolls = await db.select().from(payrollsTable).orderBy(payrollsTable.createdAt);
  const employees = await db.select().from(employeesTable);
  const empMap = Object.fromEntries(employees.map(e => [e.id, e.name]));
  res.json(ListPayrollsResponse.parse(payrolls.map(p => mapPayroll(p, empMap[p.employeeId]))));
});

router.post("/hr/payrolls", async (req, res): Promise<void> => {
  const parsed = CreatePayrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { employeeId, month, year, grossSalary, deductions, status } = parsed.data;
  const netSalary = String(parseFloat(String(grossSalary)) - parseFloat(String(deductions)));
  const [payroll] = await db.insert(payrollsTable).values({
    employeeId, month, year,
    grossSalary: String(grossSalary),
    deductions: String(deductions),
    netSalary,
    status,
  }).returning();
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, employeeId));
  res.status(201).json(mapPayroll(payroll, employee?.name));
});

router.get("/hr/summary", async (_req, res): Promise<void> => {
  const [total] = await db.select({ count: count() }).from(employeesTable);
  const [active] = await db.select({ count: count() }).from(employeesTable).where(eq(employeesTable.status, "active"));
  const deptRows = await db.select({ dept: employeesTable.department }).from(employeesTable);
  const uniqueDepts = new Set(deptRows.map(r => r.dept)).size;
  const [payrollSum] = await db.select({ total: sum(employeesTable.salary) }).from(employeesTable).where(eq(employeesTable.status, "active"));

  res.json(GetHrSummaryResponse.parse({
    totalEmployees: total?.count ?? 0,
    activeEmployees: active?.count ?? 0,
    departments: uniqueDepts,
    totalPayroll: parseFloat(payrollSum?.total ?? "0"),
  }));
});

export default router;
