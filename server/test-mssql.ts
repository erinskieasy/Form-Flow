import { getPool } from "./mssqlClient";

async function run() {
  const pool = await getPool();

  // Insert a minimal application row
  const insertSql = `INSERT INTO dbo.scholarship_applications (surname, first_name, gender, nationality, date_of_birth, age, student_id, projected_graduation_year, telephone, email, home_address, faculty_school, course_of_study, year_started_utech, gpa, programme_type, programme_mode, year_in_school, did_transfer, sport, event_position, national_representative, scholarship_tuition, scholarship_accommodation, scholarship_books)
  OUTPUT inserted.*
  VALUES (@surname, @first_name, @gender, @nationality, @date_of_birth, @age, @student_id, @projected_graduation_year, @telephone, @email, @home_address, @faculty_school, @course_of_study, @year_started_utech, @gpa, @programme_type, @programme_mode, @year_in_school, @did_transfer, @sport, @event_position, @national_representative, @scholarship_tuition, @scholarship_accommodation, @scholarship_books)`;

  const req = pool.request();
  req.input("surname", "Test");
  req.input("first_name", "Alice");
  req.input("gender", "Female");
  req.input("nationality", "Jamaica");
  req.input("date_of_birth", "2002-01-01");
  req.input("age", 23);
  req.input("student_id", "S12345");
  req.input("projected_graduation_year", "2026");
  req.input("telephone", "8765551234");
  req.input("email", "alice@example.com");
  req.input("home_address", "123 Main St");
  req.input("faculty_school", "Science");
  req.input("course_of_study", "Biology");
  req.input("year_started_utech", "2019");
  req.input("gpa", "3.50");
  req.input("programme_type", "Undergraduate");
  req.input("programme_mode", "Full-time");
  req.input("year_in_school", "3");
  req.input("did_transfer", false);
  req.input("sport", "Track");
  req.input("event_position", "Sprinter");
  req.input("national_representative", false);
  req.input("scholarship_tuition", true);
  req.input("scholarship_accommodation", false);
  req.input("scholarship_books", false);

  console.log("Inserting test application...");
  const insertRes = await req.query(insertSql);
  const inserted = insertRes.recordset[0];
  console.log("Inserted:", inserted);

  // Read it back
  const id = inserted.id;
  const selectRes = await pool.request().input("id", id).query("SELECT * FROM dbo.scholarship_applications WHERE id = @id");
  console.log("Selected:", selectRes.recordset[0]);

  await pool.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
