import pkg from 'pg';
const { Client } = pkg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Seeding Database...");

  // Cleanup
  console.log("Cleaning up existing data...");
  await client.query("DELETE FROM batch_candidates");
  await client.query("DELETE FROM batches");
  await client.query("DELETE FROM application_submissions");
  await client.query("DELETE FROM candidates");
  await client.query("DELETE FROM programs");
  await client.query("DELETE FROM users WHERE email NOT LIKE '%@sankara.com'");

  console.log("Seeding Users...");
  await client.query(`
    INSERT INTO users (full_name, email, password, role)
    VALUES ('Admin User', 'admin@sankara.com', 'admin123', 'admin')
    ON CONFLICT (email) DO NOTHING
  `);

  console.log("Seeding July 2026 Batch...");
  const programRes = await client.query(`
    INSERT INTO programs (name, code, description, academic_year)
    VALUES ('Fellowship Program - July 2026', 'FP-JUL-2026', 'Sankara Academy of Vision Fellowship Program for July 2026 batch.', '2026-27')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `);
  const programId = programRes.rows[0].id;

  const batchRes = await client.query(`
    INSERT INTO batches (name, date, timing, program_id, mcq_total_marks, psychometric_total_marks, interview_total_marks)
    VALUES (
      'July 2026 Fellowship Exam',
      '2026-07-01 09:00:00+00',
      '09:00 AM - 05:00 PM',
      ${programId},
      50,
      50,
      100
    )
    RETURNING id
  `);
  const batchId = batchRes.rows[0].id;

  console.log("Seeding Candidates...");
  const candidatesData = [
    { name: "Rahul Sharma", email: "rahul@example.com", phone: "+91 9876543210", code: "CAND001" },
    { name: "Priya Patel", email: "priya@example.com", phone: "+91 9876543211", code: "CAND002" },
    { name: "Amit Singh", email: "amit@example.com", phone: "+91 9876543212", code: "CAND003" },
    { name: "Sneha Reddy", email: "sneha@example.com", phone: "+91 9876543213", code: "CAND004" },
    { name: "Vikram Malhotra", email: "vikram@example.com", phone: "+91 9876543214", code: "CAND005" },
    { name: "Anjali Gupta", email: "anjali@example.com", phone: "+91 9876543215", code: "CAND006" },
    { name: "Siddharth Jain", email: "sid@example.com", phone: "+91 9876543216", code: "CAND007" },
    { name: "Kavita Rao", email: "kavita@example.com", phone: "+91 9876543217", code: "CAND008" },
    { name: "Vikash Verma", email: "vikash@example.com", phone: "+91 9876543218", code: "CAND009" },
    { name: "Deepika Padukone", email: "deepika@example.com", phone: "+91 9876543219", code: "CAND010" },
  ];

  for (const cand of candidatesData) {
    const candRes = await client.query(`
      INSERT INTO candidates (full_name, email, phone, candidate_code, status)
      VALUES ('${cand.name}', '${cand.email}', '${cand.phone}', '${cand.code}', 'applied')
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `);
    const candidateId = candRes.rows[0].id;

    // Create a submission for payment info
    await client.query(`
      INSERT INTO application_submissions (candidate_id, status, paid_amount, payment_id, payment_mode)
      VALUES (${candidateId}, 'submitted', 50000, 'PAYID-${cand.code}', 'Online')
      ON CONFLICT DO NOTHING
    `);

    // Assign to batch
    await client.query(`
      INSERT INTO batch_candidates (batch_id, candidate_id, status)
      VALUES (${batchId}, ${candidateId}, 'assigned')
      ON CONFLICT DO NOTHING
    `);
  }

  console.log("Database Seeded Successfully!");
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
