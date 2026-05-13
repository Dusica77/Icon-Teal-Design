import { useState } from "react";
import {
  useListProjects,
  useListTasks,
  useCreateProject,
  useCreateTask,
  getListProjectsQueryKey,
  getListTasksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Clock, CalendarDays, CheckCircle2, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useCreateProject({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        onClose();
      },
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: "", description: "", status: "planning", priority: "medium",
    startDate: today, endDate: "", budget: "", progress: "0",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      data: {
        name: form.name,
        description: form.description,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: parseFloat(form.budget),
        progress: parseInt(form.progress),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Q3 Product Launch" required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Briefly describe the project…" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Budget (USD)</Label>
              <Input type="number" min="0" step="1000" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="50000" required />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Progress (%)</Label>
              <Input type="number" min="0" max="100" value={form.progress} onChange={(e) => set("progress", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Creating…" : "Create Project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: number }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useCreateTask({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) });
        onClose();
      },
    },
  });

  const [form, setForm] = useState({
    title: "", description: "", status: "todo", priority: "medium", assignee: "", dueDate: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      projectId,
      data: {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Task Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Design wireframes" required />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="More details…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Assignee (optional)</Label>
              <Input value={form.assignee} onChange={(e) => set("assignee", e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Adding…" : "Add Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const { data: tasks, isLoading: isLoadingTasks } = useListTasks(
    selectedProjectId || 0,
    { query: { enabled: !!selectedProjectId } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage operational initiatives and deliverables.</p>
        </div>
        <Button onClick={() => setProjectOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      <NewProjectDialog open={projectOpen} onClose={() => setProjectOpen(false)} />
      {selectedProjectId && (
        <AddTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} projectId={selectedProjectId} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold px-1">Active Projects</h3>
          {isLoadingProjects ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          ) : projects && projects.length > 0 ? (
            projects.map((proj) => (
              <Card
                key={proj.id}
                className={`cursor-pointer transition-all border-l-4 hover:shadow-md ${
                  selectedProjectId === proj.id
                    ? "border-l-primary bg-primary/5 shadow-md"
                    : "border-l-transparent hover:border-l-primary/50"
                }`}
                onClick={() => setSelectedProjectId(proj.id)}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{proj.name}</CardTitle>
                    <Badge variant={
                      proj.status === "completed" ? "default" :
                      proj.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {proj.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center text-xs text-muted-foreground gap-4 mt-1 mb-3">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(proj.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">{proj.progress}%</span>
                    </div>
                    <Progress value={proj.progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">
              No projects found
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedProjectId ? (
            <Card className="border-none shadow-sm h-full min-h-[500px] flex flex-col">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{projects?.find((p) => p.id === selectedProjectId)?.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {projects?.find((p) => p.id === selectedProjectId)?.description}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setTaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {isLoadingTasks ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4 hover:bg-muted/10 transition-colors flex items-start gap-4">
                        <div className="mt-1">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                              {task.status === "in_progress" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex gap-3 mt-2">
                            <Badge variant="outline" className="text-xs font-normal">{task.priority}</Badge>
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(task.dueDate), "MMM d")}
                              </div>
                            )}
                          </div>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                            {task.assignee.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 text-muted mb-4" />
                    <p>No tasks for this project yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setTaskOpen(true)}>
                      Create the first task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm h-full min-h-[500px] flex items-center justify-center bg-muted/10 border-dashed border-2">
              <div className="text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a project to view its tasks</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
