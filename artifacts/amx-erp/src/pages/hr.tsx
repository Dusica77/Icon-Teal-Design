import { useState, useMemo } from "react";
import {
  useListEmployees, useGetHrSummary, useListPayrolls,
  useCreateEmployee, useCreatePayroll, useUpdateEmployee, useDeleteEmployee,
  getListEmployeesQueryKey, getListPayrollsQueryKey, getGetHrSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Employee } from "@workspace/api-client-react";
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
import { Plus, Users, UserCheck, Building2, Banknote, Pencil, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

function EmployeeDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Employee }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const createMutation = useCreateEmployee({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); qc.invalidateQueries({ queryKey: getGetHrSummaryQueryKey() }); toast.success("Employee added"); onClose(); },
      onError: () => toast.error("Failed to add employee"),
    },
  });
  const updateMutation = useUpdateEmployee({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); qc.invalidateQueries({ queryKey: getGetHrSummaryQueryKey() }); toast.success("Employee updated"); onClose(); },
      onError: () => toast.error("Failed to update employee"),
    },
  });

  const [form, setForm] = useState({
    name: initial?.name ?? "", email: initial?.email ?? "",
    department: initial?.department ?? "", position: initial?.position ?? "",
    salary: initial?.salary?.toString() ?? "", status: initial?.status ?? "active",
    joinedAt: initial?.joinedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
    phone: initial?.phone ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, email: form.email, department: form.department, position: form.position, salary: parseFloat(form.salary), status: form.status, joinedAt: form.joinedAt, phone: form.phone || undefined };
    if (isEdit && initial) updateMutation.mutate({ id: initial.id, data });
    else createMutation.mutate({ data });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith" required /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Engineering" required /></div>
            <div className="space-y-1.5"><Label>Position</Label><Input value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Software Engineer" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Salary (USD/yr)</Label><Input type="number" min="0" step="1000" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="75000" required /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="on_leave">On Leave</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RunPayrollDialog({ open, onClose, employees }: { open: boolean; onClose: () => void; employees: Array<{ id: number; name: string; salary: number }> }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useCreatePayroll({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPayrollsQueryKey() }); toast.success("Payroll processed"); onClose(); },
      onError: () => toast.error("Failed to process payroll"),
    },
  });

  const now = new Date();
  const [form, setForm] = useState({ employeeId: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), grossSalary: "", deductions: "", status: "paid" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleEmpChange = (v: string) => {
    const emp = employees.find((e) => String(e.id) === v);
    setForm((f) => ({ ...f, employeeId: v, grossSalary: emp ? String(Math.round(emp.salary / 12)) : f.grossSalary }));
  };
  const gross = parseFloat(form.grossSalary) || 0;
  const deductions = parseFloat(form.deductions) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: { employeeId: parseInt(form.employeeId), month: parseInt(form.month), year: parseInt(form.year), grossSalary: gross, deductions, status: form.status } });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Run Payroll</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select value={form.employeeId} onValueChange={handleEmpChange} required>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Month</Label>
              <Select value={form.month} onValueChange={(v) => set("month", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} required /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Gross Salary (USD)</Label><Input type="number" min="0" step="100" value={form.grossSalary} onChange={(e) => set("grossSalary", e.target.value)} placeholder="0.00" required /></div>
            <div className="space-y-1.5"><Label>Deductions (USD)</Label><Input type="number" min="0" step="100" value={form.deductions} onChange={(e) => set("deductions", e.target.value)} placeholder="0.00" required /></div>
          </div>
          {gross > 0 && (
            <div className="bg-muted/40 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Net Pay</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(gross - deductions)}</span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.employeeId}>{isPending ? "Processing…" : "Process Payroll"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Hr() {
  const { data: summary, isLoading: isLoadingSummary } = useGetHrSummary();
  const { data: employees, isLoading: isLoadingEmployees } = useListEmployees();
  const { data: payrolls, isLoading: isLoadingPayrolls } = useListPayrolls();
  const qc = useQueryClient();

  const [empOpen, setEmpOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<number | null>(null);

  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const deleteMutation = useDeleteEmployee({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); qc.invalidateQueries({ queryKey: getGetHrSummaryQueryKey() }); toast.success("Employee removed"); setDeleteEmployeeId(null); },
      onError: () => toast.error("Failed to delete employee"),
    },
  });

  const departments = useMemo(() => {
    const depts = [...new Set((employees ?? []).map((e) => e.department))];
    return depts.sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return (employees ?? []).filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(empSearch.toLowerCase()) || e.email.toLowerCase().includes(empSearch.toLowerCase()) || e.position.toLowerCase().includes(empSearch.toLowerCase());
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, empSearch, deptFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">HR & Payroll</h2>
          <p className="text-muted-foreground mt-1">Manage workforce, organizational structure, and payroll.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEmpOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
          <Button variant="outline" onClick={() => setPayrollOpen(true)}><Plus className="h-4 w-4 mr-2" /> Run Payroll</Button>
        </div>
      </div>

      {empOpen && <EmployeeDialog open onClose={() => setEmpOpen(false)} />}
      {editEmployee && <EmployeeDialog open onClose={() => setEditEmployee(null)} initial={editEmployee} />}
      <RunPayrollDialog open={payrollOpen} onClose={() => setPayrollOpen(false)} employees={(employees ?? []).map((e) => ({ id: e.id, name: e.name, salary: e.salary }))} />
      <AlertDialog open={!!deleteEmployeeId} onOpenChange={(o) => !o && setDeleteEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Employee?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the employee record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: deleteEmployeeId! })} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteMutation.isPending ? "Removing…" : "Remove"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : summary ? (
          <>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle><Users className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.totalEmployees}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle><UserCheck className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.activeEmployees}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle><Building2 className="h-4 w-4 text-indigo-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.departments}</div></CardContent></Card>
            <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payroll</CardTitle><Banknote className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.totalPayroll)}</div></CardContent></Card>
          </>
        ) : null}
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="mb-4"><TabsTrigger value="employees">Employees</TabsTrigger><TabsTrigger value="payroll">Payroll</TabsTrigger></TabsList>

        <TabsContent value="employees">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name, email, position…" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Position</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="w-20"></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEmployees ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{emp.name.charAt(0)}</AvatarFallback></Avatar>
                          <div><p className="font-medium text-sm">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.email}</p></div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>{formatCurrency(emp.salary)}</TableCell>
                      <TableCell><Badge variant={emp.status === "active" ? "default" : "secondary"}>{emp.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditEmployee(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteEmployeeId(emp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Period</TableHead><TableHead>Employee</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayrolls ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                ) : payrolls && payrolls.length > 0 ? (
                  payrolls.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell>{pay.month}/{pay.year}</TableCell>
                      <TableCell className="font-medium">{pay.employeeName}</TableCell>
                      <TableCell>{formatCurrency(pay.grossSalary)}</TableCell>
                      <TableCell className="text-destructive">-{formatCurrency(pay.deductions)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(pay.netSalary)}</TableCell>
                      <TableCell><Badge variant={pay.status === "paid" ? "default" : "secondary"}>{pay.status}</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payroll records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
