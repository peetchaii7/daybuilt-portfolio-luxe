import {
  GetLeadsResponse,
  SubmitLeadBody,
  UpdateLeadStatusBody,
  UpdateLeadStatusParams,
  UpdateLeadStatusResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { insertLeadSchema, leadsTable, type Lead } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";

import { requireAdmin } from "../lib/adminAuth";
import {
  deriveLeadAccessToken,
  hashLeadAccessToken,
} from "../lib/leadAccessToken";
import { ObjectStorageService } from "../lib/objectStorage";
import { verifyUploadProof } from "../lib/uploadProof";
import { createHash } from "node:crypto";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * Admin projection of a lead. Includes the AI fields the dashboard needs but
 * never the access token hash, the exact prompt or raw object storage paths.
 */
function toAdminLeadRecord(lead: Lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
    roomType: lead.roomType,
    roomSize: lead.roomSize,
    builtInType: lead.builtInType,
    materials: lead.materials,
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    description: lead.description,
    imageUrl: null,
    style: lead.style,
    colorTone: lead.colorTone,
    keepLayout: lead.keepLayout,
    timeline: lead.timeline,
    projectType: lead.projectType,
    notes: lead.notes,
    createdAt: lead.createdAt,
    aiStatus: lead.aiStatus,
    aiPromptSummary: lead.aiPromptSummary,
    aiProvider: lead.aiProvider,
    aiModel: lead.aiModel,
    aiAttempts: lead.aiAttempts,
    aiError: lead.aiError,
    aiErrorDetail: lead.aiErrorDetail,
    aiStartedAt: lead.aiStartedAt,
    aiCompletedAt: lead.aiCompletedAt,
    aiUpdatedAt: lead.aiUpdatedAt,
    hasGeneratedImage: Boolean(lead.aiImagePath),
    generatedImageUrl: lead.aiImagePath
      ? `/api/leads/${lead.id}/images/generated`
      : null,
    sourceImageUrl: lead.imageUrl
      ? `/api/leads/${lead.id}/images/source`
      : null,
  };
}

/** Design Studio needs a complete brief before we can render anything. */
const DESIGN_STUDIO_REQUIRED_FIELDS = [
  "imageUrl",
  "roomType",
  "roomSize",
  "builtInType",
  "style",
  "colorTone",
  "keepLayout",
  "timeline",
] as const;

// POST /leads — unified lead from contact, estimator, design-studio
router.post("/leads", async (req: Request, res: Response) => {
  const parsedBody = SubmitLeadBody.safeParse(req.body);
  if (!parsedBody.success) {
    req.log.warn({ issues: parsedBody.error.issues.length }, "Invalid lead body");
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" });
    return;
  }

  const body = parsedBody.data;

  if (body.source === "design-studio") {
    const missing = DESIGN_STUDIO_REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      return typeof value !== "string" || value.trim().length === 0;
    });
    if (missing.length > 0) {
      req.log.warn({ missing }, "Incomplete design-studio lead");
      res.status(400).json({
        error: "กรุณากรอกข้อมูลและอัปโหลดรูปห้องให้ครบถ้วนก่อนส่งแบบ",
      });
      return;
    }
    if (!body.designRequestId || !body.uploadProof) {
      res.status(400).json({
        error: "กรุณาอัปโหลดรูปห้องใหม่ก่อนส่งแบบ",
      });
      return;
    }
  }

  try {
    // insertLeadSchema omits every server-owned AI field and the token hash,
    // so a client body can never populate them.
    const isDesignStudio = body.source === "design-studio";
    const designRequestHash = isDesignStudio
      ? createHash("sha256")
          .update(body.designRequestId as string, "utf8")
          .digest("hex")
      : null;
    // A deterministic token lets an idempotent retry recover the same
    // customer credential without ever storing the raw value.
    const accessToken = isDesignStudio
      ? deriveLeadAccessToken(body.designRequestId as string)
      : null;

    if (isDesignStudio) {
      const existing = await db
        .select({ id: leadsTable.id })
        .from(leadsTable)
        .where(eq(leadsTable.designRequestHash, designRequestHash as string))
        .limit(1);
      if (existing[0]) {
        res.status(200).json({
          success: true,
          message: "คำขอนี้ถูกบันทึกไว้แล้ว",
          id: existing[0].id,
          accessToken,
        });
        return;
      }

      const proof = verifyUploadProof(body.uploadProof, body.imageUrl);
      if (!proof || !(await objectStorageService.validateCustomerUpload(proof))) {
        res.status(400).json({
          error: "รูปห้องไม่ถูกต้องหรือหมดอายุ กรุณาอัปโหลดใหม่",
        });
        return;
      }
    }

    const {
      designRequestId: _designRequestId,
      uploadProof: _uploadProof,
      ...clientLeadFields
    } = body;
    const dbInput = insertLeadSchema.parse(clientLeadFields);

    const inserted = await db
      .insert(leadsTable)
      .values({
        ...dbInput,
        ...(isDesignStudio
          ? {
              accessTokenHash: hashLeadAccessToken(accessToken as string),
              designRequestHash,
              aiStatus: "pending",
              aiAttempts: 0,
              aiUpdatedAt: new Date(),
            }
          : {}),
      })
      .onConflictDoNothing({ target: leadsTable.designRequestHash })
      .returning({ id: leadsTable.id });

    let lead = inserted[0];
    if (!lead && designRequestHash) {
      const existing = await db
        .select({ id: leadsTable.id })
        .from(leadsTable)
        .where(eq(leadsTable.designRequestHash, designRequestHash))
        .limit(1);
      lead = existing[0];
    }
    if (!lead) {
      throw new Error("Lead insert did not return a row");
    }

    res.status(201).json({
      success: true,
      message: "ขอบคุณสำหรับความสนใจ ทีมงานจะติดต่อกลับภายใน 1-2 วันทำการ",
      id: lead.id,
      ...(accessToken ? { accessToken } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit lead");
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" });
  }
});

// GET /leads — admin: return all leads ordered by date
router.get("/leads", requireAdmin, async (req: Request, res: Response) => {
  try {
    const leads = await db
      .select()
      .from(leadsTable)
      .orderBy(leadsTable.createdAt);

    res.json(
      GetLeadsResponse.parse({ leads: leads.map(toAdminLeadRecord) }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leads");
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// PATCH /leads/:id/status — admin: update status and notes
router.patch(
  "/leads/:id/status",
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsedParams = UpdateLeadStatusParams.safeParse({ id: req.params.id });
    if (!parsedParams.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const parsed = UpdateLeadStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    try {
      const updateData: { status: string; notes?: string } = {
        status: parsed.data.status,
      };
      if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

      const [updated] = await db
        .update(leadsTable)
        .set(updateData)
        .where(eq(leadsTable.id, parsedParams.data.id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      res.json(UpdateLeadStatusResponse.parse(toAdminLeadRecord(updated)));
    } catch (err) {
      req.log.error({ err }, "Failed to update lead status");
      res.status(500).json({ error: "Failed to update lead status" });
    }
  },
);

export default router;
