import { 
  useListProducts, 
  useGetInventorySummary 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Box, AlertTriangle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const { data: summary, isLoading: isLoadingSummary } = useGetInventorySummary();
  const { data: products, isLoading: isLoadingProducts } = useListProducts();

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground mt-1">Track products, stock levels, and asset valuation.</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : summary ? (
          <>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                <Box className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.lowStockCount}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.outOfStockCount}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingProducts ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : products && products.length > 0 ? (
              products.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell className="font-medium text-muted-foreground">{prod.sku}</TableCell>
                  <TableCell className="font-semibold">{prod.name}</TableCell>
                  <TableCell>{prod.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(prod.price)}</TableCell>
                  <TableCell className={`text-right font-medium ${prod.quantity <= prod.reorderLevel ? (prod.quantity === 0 ? 'text-destructive' : 'text-amber-500') : ''}`}>
                    {prod.quantity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      prod.status === 'in_stock' ? 'default' : 
                      prod.status === 'low_stock' ? 'secondary' : 
                      'destructive'
                    }>
                      {prod.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}