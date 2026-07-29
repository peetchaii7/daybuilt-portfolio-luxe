import { Router, type IRouter } from "express";
import { db, insertContactSchema } from "@workspace/db";
import { contactsTable } from "@workspace/db";

const router: IRouter = Router();

// Legacy /contact endpoint — kept for backward compat. New submissions use /leads.
router.post("/contact", async (req, res) => {
  try {
    const dbInput = insertContactSchema.parse({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone ?? null,
      projectType: req.body.projectType,
      budget: req.body.budget,
      description: req.body.description,
    });

    const [contact] = await db
      .insert(contactsTable)
      .values(dbInput)
      .returning({ id: contactsTable.id });

    res.status(201).json({
      success: true,
      message: "Thank you for your inquiry. We will be in touch shortly.",
      id: contact.id,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact form");
    res.status(400).json({ error: "Invalid input. Please check your form data." });
  }
});

export default router;
