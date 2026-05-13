import { Router, type IRouter } from "express";
import { db, invoicesTable, employeesTable, projectsTable, productsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { count, sum, lt, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [revenueRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.type, "income"));
  const [expenseRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.type, "expense"));
  const [employeeCount] = await db.select({ count: count() }).from(employeesTable);
  const [openProjectCount] = await db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.status, "in_progress"));
  const [lowStockCount] = await db.select({ count: count() }).from(productsTable);
  const [pendingInvoiceCount] = await db.select({ count: count() }).from(invoicesTable).where(eq(invoicesTable.status, "pending"));

  res.json({
    totalRevenue: parseFloat(revenueRow?.total ?? "0"),
    totalExpenses: parseFloat(expenseRow?.total ?? "0"),
    totalEmployees: employeeCount?.count ?? 0,
    openProjects: openProjectCount?.count ?? 0,
    lowStockItems: lowStockCount?.count ?? 0,
    pendingInvoices: pendingInvoiceCount?.count ?? 0,
  });
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable).orderBy(notificationsTable.createdAt).limit(10);
  res.json(notifications.map(n => ({
    id: n.id,
    type: n.type,
    description: n.message,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.get("/dashboard/revenue-chart", async (_req, res): Promise<void> => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((month, i) => ({
    month,
    revenue: 50000 + Math.random() * 30000 + i * 2000,
    expenses: 30000 + Math.random() * 15000 + i * 1000,
  }));
  res.json(data);
});

export default router;
