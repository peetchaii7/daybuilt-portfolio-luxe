import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
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
  style: text("style"),         // e.g. "Modern Luxury", "Minimal Luxury", "Contemporary"
  colorTone: text("color_tone"), // e.g. "Warm Neutral", "Dark Wood"
  keepLayout: text("keep_layout"), // 'yes' | 'no'
  timeline: text("timeline"),   // e.g. "ทันที", "1-3 เดือน"
  // Contact form specific
  projectType: text("project_type"),
  // Admin notes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // ── Design Studio AI generation (server-owned; never client writable) ──────
  /**
   * SHA-256 hash (hex) of the anonymous customer access token. The raw token is
   * returned exactly once from POST /leads and is never persisted or logged.
   */
  accessTokenHash: text("access_token_hash"),
  /** SHA-256 of the client request id used for idempotent lead creation. */
  designRequestHash: text("design_request_hash"),
  /** 'pending' | 'processing' | 'completed' | 'failed' */
  aiStatus: text("ai_status"),
  /** Exact prompt sent to the image model. Admin/internal only. */
  aiPrompt: text("ai_prompt"),
  /** Short, customer-safe (Thai) summary of the design concept. */
  aiPromptSummary: text("ai_prompt_summary"),
  /** Private object-storage path of the generated image. Never exposed raw. */
  aiImagePath: text("ai_image_path"),
  aiProvider: text("ai_provider"),
  aiModel: text("ai_model"),
  aiAttempts: integer("ai_attempts").notNull().default(0),
  /** Customer-safe error message (no diagnostics). */
  aiError: text("ai_error"),
  /** Admin-only diagnostic error detail. */
  aiErrorDetail: text("ai_error_detail"),
  aiStartedAt: timestamp("ai_started_at"),
  aiCompletedAt: timestamp("ai_completed_at"),
  aiUpdatedAt: timestamp("ai_updated_at"),
}, (table) => [
  uniqueIndex("leads_design_request_hash_unique").on(table.designRequestHash),
]);

/**
 * Client-writable lead fields only. Every AI/generation column and the access
 * token hash are server-owned and intentionally omitted so a request body can
 * never set them.
 */
export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  notes: true,
  accessTokenHash: true,
  designRequestHash: true,
  aiStatus: true,
  aiPrompt: true,
  aiPromptSummary: true,
  aiImagePath: true,
  aiProvider: true,
  aiModel: true,
  aiAttempts: true,
  aiError: true,
  aiErrorDetail: true,
  aiStartedAt: true,
  aiCompletedAt: true,
  aiUpdatedAt: true,
});

export type InsertLead = typeof insertLeadSchema._output;
export type Lead = typeof leadsTable.$inferSelect;

export const AI_STATUS = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;

export type AiStatus = (typeof AI_STATUS)[keyof typeof AI_STATUS];
