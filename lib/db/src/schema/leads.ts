import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source").notNull(), // 'contact' | 'estimator' | 'design-studio'
  status: text("status").notNull().default("new"), // 'new' | 'contacted' | 'quoted' | 'closed'
  // Room / built-in details
  roomType: text("room_type"),
  roomSize: text("room_size"),
  builtInType: text("built_in_type"),
  materials: text("materials"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  description: text("description"),
  imageUrl: text("image_url"), // object storage path from upload
  // Contact form specific
  projectType: text("project_type"),
  // Admin notes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  notes: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
