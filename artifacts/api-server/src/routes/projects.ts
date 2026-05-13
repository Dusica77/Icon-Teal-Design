import { Router, type IRouter } from "express";
import { db, projectsTable, tasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateProjectBody, UpdateProjectBody, GetProjectParams, UpdateProjectParams, DeleteProjectParams,
  ListTasksParams, CreateTaskBody, CreateTaskParams, UpdateTaskBody, UpdateTaskParams, DeleteTaskParams,
  ListProjectsResponse, GetProjectResponse, UpdateProjectResponse,
  ListTasksResponse, UpdateTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapProject(p: typeof projectsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    priority: p.priority,
    startDate: p.startDate,
    endDate: p.endDate,
    budget: parseFloat(p.budget),
    progress: p.progress,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapTask(t: typeof tasksTable.$inferSelect) {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee ?? null,
    dueDate: t.dueDate ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  res.json(ListProjectsResponse.parse(projects.map(mapProject)));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.insert(projectsTable).values({ ...parsed.data, budget: String(parsed.data.budget) }).returning();
  res.status(201).json(GetProjectResponse.parse(mapProject(project)));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(mapProject(project)));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData = parsed.data.budget !== undefined
    ? { ...parsed.data, budget: String(parsed.data.budget) }
    : parsed.data;
  const [project] = await db.update(projectsTable).set(updateData).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(UpdateProjectResponse.parse(mapProject(project)));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = ListTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, params.data.projectId)).orderBy(tasksTable.createdAt);
  res.json(ListTasksResponse.parse(tasks.map(mapTask)));
});

router.post("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const pathParams = CreateTaskParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values({ ...parsed.data, projectId: pathParams.data.projectId }).returning();
  res.status(201).json(mapTask(task));
});

router.patch("/projects/:projectId/tasks/:taskId", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.update(tasksTable).set(parsed.data).where(eq(tasksTable.id, params.data.taskId)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateTaskResponse.parse(mapTask(task)));
});

router.delete("/projects/:projectId/tasks/:taskId", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.taskId)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
