import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, lte, count, sum } from "drizzle-orm";
import {
  CreateProductBody, UpdateProductBody, GetProductParams, UpdateProductParams, DeleteProductParams,
  ListProductsResponse, GetProductResponse, UpdateProductResponse,
  GetInventorySummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    quantity: p.quantity,
    price: parseFloat(p.price),
    reorderLevel: p.reorderLevel,
    status: p.status,
    description: p.description ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/inventory/products", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.createdAt);
  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

router.post("/inventory/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values({ ...parsed.data, price: String(parsed.data.price) }).returning();
  res.status(201).json(GetProductResponse.parse(mapProduct(product)));
});

router.get("/inventory/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(mapProduct(product)));
});

router.patch("/inventory/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData = parsed.data.price !== undefined
    ? { ...parsed.data, price: String(parsed.data.price) }
    : parsed.data;
  const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

router.delete("/inventory/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/inventory/summary", async (_req, res): Promise<void> => {
  const [total] = await db.select({ count: count() }).from(productsTable);
  const [valueRow] = await db.select({ total: sum(productsTable.price) }).from(productsTable);
  const products = await db.select().from(productsTable);
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;

  res.json(GetInventorySummaryResponse.parse({
    totalProducts: total?.count ?? 0,
    totalValue: parseFloat(valueRow?.total ?? "0"),
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
  }));
});

export default router;
