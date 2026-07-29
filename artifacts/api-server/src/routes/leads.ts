import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leadsTable, insertLeadSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "daybuilt-admin-2025";
const VALID_STATUSES = ["new", "contacted", "quoted", "closed"] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

function requireAdmin(
  req: Parameters<typeof router.use>[1],
  res: Parameters<typeof router.use>[2],
  next: Parameters<typeof router.use>[3],
) {
  const key = (req as any).headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    (res as any).status(401).json({ error: "Unauthorized" });
    return;
  }
  (next as any)();
}

// POST /leads — unified lead from contact, estimator, design-studio
router.post("/leads", async (req, res) => {
  try {
    const dbInput = insertLeadSchema.parse(req.body);
    const [lead] = await db
      .insert(leadsTable)
      .values(dbInput)
      .returning({ id: leadsTable.id });
    res.status(201).json({
      success: true,
      message:
        "ขอบคุณสำหรับความสนใจ ทีมงานจะติดต่อกลับภายใน 1-2 วันทำการ",
      id: lead.id,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit lead");
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" });
  }
});

// GET /leads — admin: return all leads ordered by newest first
router.get("/leads", async (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const leads = await db
      .select()
      .from(leadsTable)
      .orderBy(leadsTable.createdAt);
    res.json({ leads });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leads");
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// PATCH /leads/:id/status — admin: update status and notes
router.patch("/leads/:id/status", async (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { status, notes } = req.body as {
      status?: string;
      notes?: string;
    };

    if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const updateData: { status: LeadStatus; notes?: string } = {
      status: status as LeadStatus,
    };
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update lead status");
    res.status(500).json({ error: "Failed to update lead status" });
  }
});

export default router;
