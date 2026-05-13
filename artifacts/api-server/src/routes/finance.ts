import { Router, type IRouter } from "express";
import { db, invoicesTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateInvoiceBody, UpdateInvoiceBody, GetInvoiceParams, UpdateInvoiceParams, DeleteInvoiceParams,
  CreateTransactionBody,
  ListInvoicesResponse, GetInvoiceResponse, UpdateInvoiceResponse,
  ListTransactionsResponse, GetFinanceSummaryResponse,
} from "@workspace/api-zod";
import { sum, count } from "drizzle-orm";

const router: IRouter = Router();

function mapInvoice(inv: typeof invoicesTable.$inferSelect) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName,
    amount: parseFloat(inv.amount),
    status: inv.status,
    dueDate: inv.dueDate,
    description: inv.description ?? null,
    createdAt: inv.createdAt.toISOString(),
  };
}

function mapTransaction(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    category: t.category,
    description: t.description,
    date: t.date,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/finance/invoices", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable).orderBy(invoicesTable.createdAt);
  res.json(ListInvoicesResponse.parse(invoices.map(mapInvoice)));
});

router.post("/finance/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [invoice] = await db.insert(invoicesTable).values(parsed.data).returning();
  res.status(201).json(GetInvoiceResponse.parse(mapInvoice(invoice)));
});

router.get("/finance/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(GetInvoiceResponse.parse(mapInvoice(invoice)));
});

router.patch("/finance/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [invoice] = await db.update(invoicesTable).set(parsed.data).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(UpdateInvoiceResponse.parse(mapInvoice(invoice)));
});

router.delete("/finance/invoices/:id", async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [invoice] = await db.delete(invoicesTable).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/finance/transactions", async (_req, res): Promise<void> => {
  const txns = await db.select().from(transactionsTable).orderBy(transactionsTable.createdAt);
  res.json(ListTransactionsResponse.parse(txns.map(mapTransaction)));
});

router.post("/finance/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [txn] = await db.insert(transactionsTable).values(parsed.data).returning();
  res.status(201).json(mapTransaction(txn));
});

router.get("/finance/summary", async (_req, res): Promise<void> => {
  const [revenueRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.type, "income"));
  const [expenseRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.type, "expense"));
  const [paidCount] = await db.select({ count: count() }).from(invoicesTable).where(eq(invoicesTable.status, "paid"));
  const [pendingCount] = await db.select({ count: count() }).from(invoicesTable).where(eq(invoicesTable.status, "pending"));
  const revenue = parseFloat(revenueRow?.total ?? "0");
  const expenses = parseFloat(expenseRow?.total ?? "0");
  res.json(GetFinanceSummaryResponse.parse({
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: revenue - expenses,
    invoicesPaid: paidCount?.count ?? 0,
    invoicesPending: pendingCount?.count ?? 0,
  }));
});

export default router;
