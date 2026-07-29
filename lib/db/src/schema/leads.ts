import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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
  // Design Studio specific
  style: text("style"),         // e.g. "Japandi", "Modern Luxury", "Minimal"
  colorTone: text("color_tone"), // e.g. "Warm Neutral", "Dark Wood"
  keepLayout: text("keep_layout"), // 'yes' | 'no'
  timeline: text("timeline"),   // e.g. "ทันที", "1-3 เดือน"
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

export type InsertLead = typeof insertLeadSchema._output;
export type Lead = typeof leadsTable.$inferSelect;
