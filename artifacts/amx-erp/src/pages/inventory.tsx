import { useState, useMemo } from "react";
import {
  useListProducts, useGetInventorySummary,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey, getGetInventorySummaryQueryKey,
} from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Box, AlertTriangle, XCircle, Pencil, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

function ProductDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Product }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); qc.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() }); toast.success("Product added"); onClose(); },
      onError: () => toast.error("Failed to add product"),
    },
  });
  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); qc.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() }); toast.success("Product updated"); onClose(); },
      onError: () => toast.error("Failed to update product"),
    },
  });

  const [form, setForm] = useState({
    name: initial?.name ?? "", sku: initial?.sku ?? "", category: initial?.category ?? "",
    quantity: initial?.quantity?.toString() ?? "", price: initial?.price?.toString() ?? "",
    reorderLevel: initial?.reorderLevel?.toString() ?? "10",
    status: initial?.status ?? "in_stock", description: initial?.description ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, category: form.category, quantity: parseInt(form.quantity), price: parseFloat(form.price), reorderLevel: parseInt(form.reorderLevel), status: form.status, description: form.description || undefined };
    if (isEdit && initial) updateMutation.mutate({ id: initial.id, data });
    else createMutation.mutate({ data: { ...data, sku: form.sku } });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Product Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Wireless Headphones" required /></div>
            <div className="space-y-1.5"><Label>SKU</Label><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="WH-001" disabled={isEdit} required={!isEdit} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Electronics" required /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="in_stock">In Stock</SelectItem><SelectItem value="low_stock">Low Stock</SelectItem><SelectItem value="out_of_stock">Out of Stock</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Price (USD)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" required /></div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" required /></div>
            <div className="space-y-1.5"><Label>Reorder Level</Label><Input type="number" min="0" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} placeholder="10" required /></div>
          </div>
          <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Brief product description…" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Inventory() {
  const { data: summary, isLoading: isLoadingSummary } = useGetInventorySummary();
  const { data: products, isLoading: isLoadingProducts } = useListProducts();
  const qc = useQueryClient();

  const [productOpen, setProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); qc.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() }); toast.success("Product deleted"); setDeleteProductId(null); },
      onError: () => toast.error("Failed to delete product"),
    },
  });

  const categories = useMemo(() => [...new Set((products ?? []).map((p) => p.category))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    return (products ?? []).filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground mt-1">Track products, stock levels, and asset valuation.</p>
        </div>
        <Button onClick={() => setProductOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
      </div>

      {productOpen && <ProductDialog open onClose={() => setProductOpen(false)} />}
      {editProduct && <ProductDialog open onClose={() => setEditProduct(null)} initial={editProduct} />}
      <AlertDialog open={!!deleteProductId} onOpenChange={(o) => !o && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Product?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the product from inventory.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: deleteProductId! })} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteMutation.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : summary ? (
          <>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle><Package className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.totalProducts}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle><Box className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.lowStockCount}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle><XCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.outOfStockCount}</div></CardContent></Card>
          </>
        ) : null}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>SKU</TableHead><TableHead>Product Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Stock</TableHead><TableHead>Status</TableHead><TableHead className="w-20"></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingProducts ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell className="font-medium text-muted-foreground">{prod.sku}</TableCell>
                  <TableCell className="font-semibold">{prod.name}</TableCell>
                  <TableCell>{prod.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(prod.price)}</TableCell>
                  <TableCell className={`text-right font-medium ${prod.quantity <= prod.reorderLevel ? (prod.quantity === 0 ? "text-destructive" : "text-amber-500") : ""}`}>{prod.quantity}</TableCell>
                  <TableCell><Badge variant={prod.status === "in_stock" ? "default" : prod.status === "low_stock" ? "secondary" : "destructive"}>{prod.status.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct(prod)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteProductId(prod.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
