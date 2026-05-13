import { Router, type IRouter } from "express";
import { db, transactionsTable, employeesTable, projectsTable } from "@workspace/db";
import { eq, sum, count } from "drizzle-orm";
import {
  GetAnalyticsOverviewResponse,
  GetDepartmentSpendingResponse,
  GetProjectStatusBreakdownResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/overview", async (_req, res): Promise<void> => {
  res.json(GetAnalyticsOverviewResponse.parse({
    revenueGrowth: 12.4,
    expenseGrowth: 5.2,
    employeeGrowth: 8.1,
    projectCompletionRate: 73.5,
  }));
});

router.get("/analytics/department-spending", async (_req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable);
  const deptMap: Record<string, number> = {};
  for (const emp of employees) {
    const dept = emp.department;
    deptMap[dept] = (deptMap[dept] ?? 0) + parseFloat(emp.salary);
  }
  const result = Object.entries(deptMap).map(([department, amount]) => ({ department, amount }));
  res.json(GetDepartmentSpendingResponse.parse(result));
});

router.get("/analytics/project-status", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable);
  const statusMap: Record<string, number> = {};
  for (const p of projects) {
    statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
  }
  const result = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
  res.json(GetProjectStatusBreakdownResponse.parse(result));
});

export default router;
