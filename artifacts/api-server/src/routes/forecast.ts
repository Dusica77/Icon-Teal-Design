import { Router, type IRouter } from "express";
import { db, productsTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetDemandForecastResponse,
  GetRevenueForecastResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/forecast/demand", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).limit(6);
  const months = ["Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025"];
  const result = products.map((p, i) => ({
    productName: p.name,
    currentDemand: p.quantity,
    forecastedDemand: Math.round(p.quantity * (1.1 + i * 0.05 + Math.random() * 0.2)),
    period: months[i % months.length],
  }));
  res.json(GetDemandForecastResponse.parse(result));
});

router.get("/forecast/revenue", async (_req, res): Promise<void> => {
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((month, i) => ({
    month,
    revenue: 70000 + Math.random() * 20000 + i * 3000,
    expenses: 40000 + Math.random() * 10000 + i * 1500,
  }));
  res.json(GetRevenueForecastResponse.parse(data));
});

export default router;
