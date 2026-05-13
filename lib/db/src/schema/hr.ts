import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  salary: numeric("salary", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  joinedAt: text("joined_at").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;

export const payrollsTable = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  grossSalary: numeric("gross_salary", { precision: 12, scale: 2 }).notNull(),
  deductions: numeric("deductions", { precision: 12, scale: 2 }).notNull(),
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPayrollSchema = createInsertSchema(payrollsTable).omit({ id: true, createdAt: true, updatedAt: true, netSalary: true });
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrollsTable.$inferSelect;
