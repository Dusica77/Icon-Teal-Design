import { useState, useMemo } from "react";
import {
  useListInvoices, useListTransactions, useGetFinanceSummary,
  useCreateInvoice, useCreateTransaction, useUpdateInvoice,
  useDeleteInvoice,
  getListInvoicesQueryKey, getListTransactionsQueryKey, getGetFinanceSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Invoice, Transaction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, ArrowUpRight, ArrowDownRight, FileText, Pencil, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

function InvoiceDialog({ open, onClose, initial }: {
  open: boolean; onClose: () => void; initial?: Invoice;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const createMutation = useCreateInvoice({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }); qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() }); toast.success("Invoice created"); onClose(); },
      onError: () => toast.error("Failed to create invoice"),
    },
  });
  const updateMutation = useUpdateInvoice({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }); qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() }); toast.success("Invoice updated"); onClose(); },
      onError: () => toast.error("Failed to update invoice"),
    },
  });

  const [form, setForm] = useState({
    invoiceNumber: initial?.invoiceNumber ?? `INV-${Date.now().toString().slice(-6)}`,
    clientName: initial?.clientName ?? "",
    amount: initial?.amount?.toString() ?? "",
    status: initial?.status ?? "pending",
    dueDate: initial?.dueDate?.split("T")[0] ?? "",
    description: initial?.description ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && initial) {
      updateMutation.mutate({ id: initial.id, data: { clientName: form.clientName, amount: parseFloat(form.amount), status: form.status, dueDate: form.dueDate, description: form.description || undefined } });
    } else {
      createMutation.mutate({ data: { invoiceNumber: form.invoiceNumber, clientName: form.clientName, amount: parseFloat(form.amount), status: form.status, dueDate: form.dueDate, description: form.description || undefined } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice #</Label>
              <Input value={form.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} disabled={isEdit} required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Client Name</Label>
            <Input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Acme Corp" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Services rendered..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Invoice")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewTransactionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useCreateTransaction({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() }); qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() }); toast.success("Transaction added"); onClose(); },
      onError: () => toast.error("Failed to add transaction"),
    },
  });

  const [form, setForm] = useState({ type: "income", amount: "", category: "", description: "", date: new Date().toISOString().split("T")[0] });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: { type: form.type, amount: parseFloat(form.amount), category: form.category, description: form.description, date: form.date } });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Sales, Rent…" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Add Transaction"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({ open, onClose, onConfirm, label, isPending }: { open: boolean; onClose: () => void; onConfirm: () => void; label: string; isPending: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Finance() {
  const { data: summary, isLoading: isLoadingSummary } = useGetFinanceSummary();
  const { data: invoices, isLoading: isLoadingInvoices } = useListInvoices();
  const { data: transactions, isLoading: isLoadingTransactions } = useListTransactions();
  const qc = useQueryClient();

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");

  const deleteInvoiceMutation = useDeleteInvoice({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }); qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() }); toast.success("Invoice deleted"); setDeleteInvoiceId(null); },
      onError: () => toast.error("Failed to delete invoice"),
    },
  });

  const filteredInvoices = useMemo(() => {
    return (invoices ?? []).filter((inv) => {
      const matchSearch = inv.clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase());
      const matchStatus = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter]);

  const filteredTransactions = useMemo(() => {
    return (transactions ?? []).filter((tx) => {
      const matchSearch = tx.description.toLowerCase().includes(txSearch.toLowerCase()) || tx.category.toLowerCase().includes(txSearch.toLowerCase());
      const matchType = txTypeFilter === "all" || tx.type === txTypeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, txSearch, txTypeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
          <p className="text-muted-foreground mt-1">Manage invoices, track transactions, and view financial health.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setInvoiceOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
          <Button variant="outline" onClick={() => setTransactionOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Transaction</Button>
        </div>
      </div>

      {invoiceOpen && <InvoiceDialog open onClose={() => setInvoiceOpen(false)} />}
      {editInvoice && <InvoiceDialog open onClose={() => setEditInvoice(null)} initial={editInvoice} />}
      <NewTransactionDialog open={transactionOpen} onClose={() => setTransactionOpen(false)} />
      <DeleteConfirm open={!!deleteInvoiceId} onClose={() => setDeleteInvoiceId(null)} onConfirm={() => deleteInvoiceMutation.mutate({ id: deleteInvoiceId! })} label="Invoice" isPending={deleteInvoiceMutation.isPending} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : summary ? (
          <>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle><DollarSign className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.netProfit)}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle><ArrowUpRight className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle><ArrowDownRight className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle><FileText className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.invoicesPending}</div></CardContent></Card>
          </>
        ) : null}
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="mb-4"><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="transactions">Transactions</TabsTrigger></TabsList>

        <TabsContent value="invoices">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by client or invoice #…" value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} />
            </div>
            <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.clientName}</TableCell>
                      <TableCell>{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>{format(new Date(inv.dueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>{inv.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditInvoice(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteInvoiceId(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by description or category…" value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
            </div>
            <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-16"></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell><Badge variant={tx.type === "income" ? "default" : "destructive"}>{tx.type}</Badge></TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>{tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
