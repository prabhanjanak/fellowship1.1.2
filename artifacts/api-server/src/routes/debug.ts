import { Router } from "express";
import { db, usersTable, candidatesTable, applicationFormsTable, programsTable, applicationSubmissionsTable, batchesTable, batchCandidatesTable, seatMatrixEntriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth, requireRole } from "../middleware/auth";
import { comparePassword } from "../lib/auth";

const router = Router();

router.post("/debug/seed", async (req, res) => {
  try {
    logger.info("Manual seed requested");

    // Cleanup
    await db.delete(batchCandidatesTable);
    await db.delete(batchesTable);
    await db.delete(applicationSubmissionsTable);
    await db.delete(candidatesTable);
    await db.delete(applicationFormsTable);
    await db.delete(seatMatrixEntriesTable);
    await db.delete(programsTable);
    
    // We don't delete users to avoid locking ourselves out, 
    // but we can delete non-admin test users if needed.
    // await db.delete(usersTable).where(sql`role != 'super_admin'`);

    // Create a Program
    const [program] = await db.insert(programsTable).values({
      name: "Fellowship Program July 2026",
      code: "FP-JUL-2026",
      academicYear: "2026",
      description: "Dummy seed data for testing purposes"
    }).returning();

    // Create a Batch
    const [batch] = await db.insert(batchesTable).values({
      programId: program.id,
      name: "July 2026 Entrance",
      date: new Date("2026-07-01"),
      timing: "09:00 AM - 12:00 PM",
      mcqTotalMarks: 100,
      psychometricTotalMarks: 50,
      interviewTotalMarks: 100,
    }).returning();

    // Create Seat Matrix Entries
    const specialities = ["Vitreo Retina", "Medical Retina", "Cornea", "Glaucoma", "Oculoplasty"];
    const units = ["Bengaluru", "Coimbatore", "Chennai"];

    for (const spec of specialities) {
      for (const unit of units) {
        await db.insert(seatMatrixEntriesTable).values({
          programId: program.id,
          speciality: spec,
          unitName: unit,
          totalSeats: Math.floor(Math.random() * 5) + 2,
          allocatedSeats: 0
        });
      }
    }

    // Create Dummy Candidates
    const names = ["Rahul Sharma", "Priya Patel", "Amit Singh", "Sneha Reddy", "Vikram Malhotra", "Anjali Gupta"];
    for (let i = 0; i < names.length; i++) {
      const [cand] = await db.insert(candidatesTable).values({
        fullName: names[i],
        email: `test${i}@example.com`,
        candidateCode: `CAND00${i + 1}`,
        status: "pending",
        phone: "+91 900000000" + i,
      }).returning();

      // Submission
      await db.insert(applicationSubmissionsTable).values({
        candidateId: cand.id,
        status: "pending",
        submittedAt: new Date(),
        paidAmount: 5000,
        paymentId: `PAY-${cand.candidateCode}`,
        paymentMode: "Online"
      });

      // Batch Assignment
      await db.insert(batchCandidatesTable).values({
        batchId: batch.id,
        candidateId: cand.id,
        status: "assigned"
      });
    }

    res.json({ message: "Seed completed successfully" });
  } catch (error) {
    logger.error({ error }, "Seed failed");
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/debug/reset-database", requireAuth, requireRole("super_admin"), async (req, res) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ error: "Password is required to reset the database" });
      return;
    }

    // Verify password
    const userId = req.user!.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Incorrect password. Database reset aborted." });
      return;
    }

    logger.info(`Database reset requested by super_admin ${user.email}`);

    // Proceed to delete all non-user data
    await db.delete(batchCandidatesTable);
    await db.delete(batchesTable);
    await db.delete(applicationSubmissionsTable);
    await db.delete(candidatesTable);
    await db.delete(applicationFormsTable);
    await db.delete(seatMatrixEntriesTable);
    await db.delete(programsTable);

    res.json({ message: "Database has been reset successfully." });
  } catch (error) {
    logger.error({ error }, "Database reset failed");
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
