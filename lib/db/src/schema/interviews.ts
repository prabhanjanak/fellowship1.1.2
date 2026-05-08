import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewScoresTable = pgTable("interview_scores", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  batchId: integer("batch_id"), // Linked to the batch for this interview session
  score: real("score").notNull(),
  totalMarks: real("total_marks").notNull().default(100),
  remarks: text("remarks"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctorAssignmentsTable = pgTable("doctor_assignments", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  batchId: integer("batch_id"),
  status: text("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInterviewScoreSchema = createInsertSchema(interviewScoresTable).omit({ id: true, submittedAt: true });
export type InsertInterviewScore = z.infer<typeof insertInterviewScoreSchema>;
export type InterviewScore = typeof interviewScoresTable.$inferSelect;
