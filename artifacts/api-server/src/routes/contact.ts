import { Router, type IRouter } from "express";
import { db, insertContactSchema } from "@workspace/db";
import { contactsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  try {
    const body = SubmitContactBody.parse(req.body);

    const dbInput = insertContactSchema.parse({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      projectType: body.projectType,
      budget: body.budget,
      description: body.description,
    });

    const [contact] = await db.insert(contactsTable).values(dbInput).returning({ id: contactsTable.id });

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
