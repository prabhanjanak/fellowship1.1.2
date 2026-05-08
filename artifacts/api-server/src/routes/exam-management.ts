import { Router } from "express";
import { db, batchesTable, batchCandidatesTable, documentTemplatesTable, candidatesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

// Batches
router.get("/batches", requireAuth, async (req, res) => {
  try {
    const batches = await db.select().from(batchesTable);
    
    // Enrich with candidate count
    const enriched = await Promise.all(batches.map(async (b) => {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM batch_candidates WHERE batch_id = ${b.id}
      `);
      return { ...b, candidateCount: Number((result.rows[0] as any).count) };
    }));
    
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/batches", requireAuth, requireRole("super_admin", "program_admin", "central_exam_coordinator"), async (req, res) => {
  try {
    const [batch] = await db.insert(batchesTable).values({
      ...req.body,
      date: new Date(req.body.date),
    }).returning();
    res.json(batch);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/batches/:id/candidates", requireAuth, requireRole("super_admin", "program_admin", "central_exam_coordinator"), async (req, res) => {
  try {
    const batchId = Number(req.params.id);
    const { candidateIds } = req.body as { candidateIds: number[] };
    
    const values = candidateIds.map(cid => ({
      batchId,
      candidateId: cid,
    }));
    
    await db.insert(batchCandidatesTable).values(values);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Templates
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const templates = await db.select().from(documentTemplatesTable);
    res.json(templates);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/templates", requireAuth, requireRole("super_admin", "program_admin", "central_exam_coordinator"), async (req, res) => {
  try {
    const [template] = await db.insert(documentTemplatesTable).values(req.body).returning();
    res.json(template);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/templates/:id", requireAuth, requireRole("super_admin", "program_admin", "central_exam_coordinator"), async (req, res) => {
  try {
    const [updated] = await db.update(documentTemplatesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(documentTemplatesTable.id, Number(req.params.id)))
      .returning();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
