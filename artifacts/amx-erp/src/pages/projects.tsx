import { useState } from "react";
import { 
  useListProjects,
  useListTasks
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Clock, CalendarDays, CheckCircle2, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Projects() {
  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

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
        <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
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
                    ? 'border-l-primary bg-primary/5 shadow-md' 
                    : 'border-l-transparent hover:border-l-primary/50'
                }`}
                onClick={() => setSelectedProjectId(proj.id)}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{proj.name}</CardTitle>
                    <Badge variant={
                      proj.status === 'completed' ? 'default' : 
                      proj.status === 'in_progress' ? 'secondary' : 
                      'outline'
                    }>
                      {proj.status.replace('_', ' ')}
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
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">No projects found</div>
          )}
        </div>

        {/* Project Details & Tasks */}
        <div className="lg:col-span-2">
          {selectedProjectId ? (
            <Card className="border-none shadow-sm h-full min-h-[500px] flex flex-col">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{projects?.find(p => p.id === selectedProjectId)?.name}</CardTitle>
                    <CardDescription className="mt-1">{projects?.find(p => p.id === selectedProjectId)?.description}</CardDescription>
                  </div>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
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
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                              {task.status === 'in_progress' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                          <div className="flex gap-3 mt-2">
                            <Badge variant="outline" className="text-xs font-normal">
                              {task.priority}
                            </Badge>
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
                    <Button variant="outline" className="mt-4">Create the first task</Button>
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