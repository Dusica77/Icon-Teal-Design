import { useState, useMemo } from "react";
import {
  useListProjects, useListTasks,
  useCreateProject, useCreateTask, useUpdateProject, useDeleteProject, useUpdateTask, useDeleteTask,
  getListProjectsQueryKey, getListTasksQueryKey,
} from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, CalendarDays, CheckCircle2, Briefcase, Pencil, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function ProjectDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Project }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const createMutation = useCreateProject({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }); toast.success("Project created"); onClose(); },
      onError: () => toast.error("Failed to create project"),
    },
  });
  const updateMutation = useUpdateProject({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }); toast.success("Project updated"); onClose(); },
      onError: () => toast.error("Failed to update project"),
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: initial?.name ?? "", description: initial?.description ?? "",
    status: initial?.status ?? "planning", priority: initial?.priority ?? "medium",
    startDate: initial?.startDate?.split("T")[0] ?? today,
    endDate: initial?.endDate?.split("T")[0] ?? "",
    budget: initial?.budget?.toString() ?? "", progress: initial?.progress?.toString() ?? "0",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, description: form.description, status: form.status, priority: form.priority, startDate: form.startDate, endDate: form.endDate, budget: parseFloat(form.budget), progress: parseInt(form.progress) };
    if (isEdit && initial) updateMutation.mutate({ id: initial.id, data });
    else createMutation.mutate({ data });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Project Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Q3 Product Launch" required /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Briefly describe the project…" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="planning">Planning</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="on_hold">On Hold</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Budget (USD)</Label><Input type="number" min="0" step="1000" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="50000" required /></div>
            <div className="space-y-1.5"><Label>Progress (%)</Label><Input type="number" min="0" max="100" value={form.progress} onChange={(e) => set("progress", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}</Button>
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
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) }); toast.success("Task added"); onClose(); },
      onError: () => toast.error("Failed to add task"),
    },
  });

  const [form, setForm] = useState({ title: "", description: "", status: "todo", priority: "medium", assignee: "", dueDate: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ projectId, data: { title: form.title, description: form.description || undefined, status: form.status, priority: form.priority, assignee: form.assignee || undefined, dueDate: form.dueDate || undefined } });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Task Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Design wireframes" required /></div>
          <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="More details…" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Assignee (optional)</Label><Input value={form.assignee} onChange={(e) => set("assignee", e.target.value)} placeholder="Jane Smith" /></div>
            <div className="space-y-1.5"><Label>Due Date (optional)</Label><Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></div>
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
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [deleteTaskInfo, setDeleteTaskInfo] = useState<{ projectId: number; taskId: number } | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const qc = useQueryClient();

  const { data: tasks, isLoading: isLoadingTasks } = useListTasks(
    selectedProjectId || 0,
    { query: { enabled: !!selectedProjectId } }
  );

  const deleteProjectMutation = useDeleteProject({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast.success("Project deleted");
        setDeleteProjectId(null);
        if (selectedProjectId === deleteProjectId) setSelectedProjectId(null);
      },
      onError: () => toast.error("Failed to delete project"),
    },
  });

  const deleteTaskMutation = useDeleteTask({
    mutation: {
      onSuccess: () => {
        if (selectedProjectId) qc.invalidateQueries({ queryKey: getListTasksQueryKey(selectedProjectId) });
        toast.success("Task deleted");
        setDeleteTaskInfo(null);
      },
      onError: () => toast.error("Failed to delete task"),
    },
  });

  const updateTaskMutation = useUpdateTask({
    mutation: {
      onSuccess: () => {
        if (selectedProjectId) qc.invalidateQueries({ queryKey: getListTasksQueryKey(selectedProjectId) });
      },
      onError: () => toast.error("Failed to update task"),
    },
  });

  const toggleTaskStatus = (task: { id: number; status: string }) => {
    if (!selectedProjectId) return;
    const next = task.status === "completed" ? "todo" : task.status === "todo" ? "in_progress" : "completed";
    updateTaskMutation.mutate({ projectId: selectedProjectId, taskId: task.id, data: { status: next } });
  };

  const filteredProjects = useMemo(() => {
    return (projects ?? []).filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(projectSearch.toLowerCase());
      const matchStatus = projectStatusFilter === "all" || p.status === projectStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, projectSearch, projectStatusFilter]);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage operational initiatives and deliverables.</p>
        </div>
        <Button onClick={() => setProjectOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Project</Button>
      </div>

      {projectOpen && <ProjectDialog open onClose={() => setProjectOpen(false)} />}
      {editProject && <ProjectDialog open onClose={() => setEditProject(null)} initial={editProject} />}
      {selectedProjectId && taskOpen && <AddTaskDialog open onClose={() => setTaskOpen(false)} projectId={selectedProjectId} />}

      <AlertDialog open={!!deleteProjectId} onOpenChange={(o) => !o && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>This will delete the project and all its tasks permanently.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteProjectMutation.mutate({ id: deleteProjectId! })} disabled={deleteProjectMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteProjectMutation.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTaskInfo} onOpenChange={(o) => !o && setDeleteTaskInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the task.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTaskMutation.mutate({ projectId: deleteTaskInfo!.projectId, taskId: deleteTaskInfo!.taskId })} disabled={deleteTaskMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteTaskMutation.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 h-9 text-sm" placeholder="Search projects…" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} />
            </div>
            <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
              <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingProjects ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((proj) => (
              <Card
                key={proj.id}
                className={`cursor-pointer transition-all border-l-4 hover:shadow-md ${selectedProjectId === proj.id ? "border-l-primary bg-primary/5 shadow-md" : "border-l-transparent hover:border-l-primary/50"}`}
                onClick={() => setSelectedProjectId(proj.id)}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base leading-snug">{proj.name}</CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditProject(proj); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteProjectId(proj.id); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <Badge className="w-fit mt-1" variant={proj.status === "completed" ? "default" : proj.status === "in_progress" ? "secondary" : "outline"}>
                    {proj.status.replace(/_/g, " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center text-xs text-muted-foreground gap-1 mb-3">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(proj.endDate), "MMM d, yyyy")}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span>Progress</span><span className="font-medium">{proj.progress}%</span></div>
                    <Progress value={proj.progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">No projects found</div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedProjectId && selectedProject ? (
            <Card className="border-none shadow-sm h-full min-h-[500px] flex flex-col">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    <CardDescription className="mt-1">{selectedProject.description}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {isLoadingTasks ? (
                  <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4 hover:bg-muted/10 transition-colors flex items-start gap-4 group">
                        <button
                          className="mt-1 shrink-0"
                          onClick={() => toggleTaskStatus(task)}
                          title={task.status === "completed" ? "Mark as to-do" : task.status === "todo" ? "Mark in progress" : "Mark complete"}
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors">
                              {task.status === "in_progress" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h4>
                          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                          <div className="flex gap-3 mt-2">
                            <Badge variant="outline" className="text-xs font-normal">{task.priority}</Badge>
                            <Badge variant={task.status === "completed" ? "default" : task.status === "in_progress" ? "secondary" : "outline"} className="text-xs font-normal">{task.status.replace(/_/g, " ")}</Badge>
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{format(new Date(task.dueDate), "MMM d")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {task.assignee && (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                              {task.assignee.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteTaskInfo({ projectId: selectedProjectId, taskId: task.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 text-muted mb-4" />
                    <p>No tasks for this project yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setTaskOpen(true)}>Create the first task</Button>
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
