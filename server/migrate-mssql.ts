import 'dotenv/config';
import { getPool } from "./mssqlClient";

async function run() {
  const pool = await getPool();

  // Ensure the 'sca' schema exists before creating any tables
  const createSchema = `
    IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'sca')
      EXEC('CREATE SCHEMA sca');
  `;

  const createUsers = `
    IF OBJECT_ID('sca.users', 'U') IS NULL
    CREATE TABLE sca.users (
      id varchar(36) PRIMARY KEY DEFAULT (CONVERT(varchar(36), NEWID())),
      username nvarchar(255) NOT NULL UNIQUE,
      password nvarchar(1024) NOT NULL
    );
  `;

  const createApplications = `
    IF OBJECT_ID('sca.scholarship_applications', 'U') IS NULL
    CREATE TABLE sca.scholarship_applications (
      id varchar(36) PRIMARY KEY DEFAULT (CONVERT(varchar(36), NEWID())),
      submission_date date NOT NULL DEFAULT (CONVERT(date, GETDATE())),
      semester1_amount int NULL,
      semester2_amount int NULL,

      surname nvarchar(max) NOT NULL,
      first_name nvarchar(max) NOT NULL,
      middle_name nvarchar(max) NULL,
      gender nvarchar(50) NOT NULL,
      nationality nvarchar(100) NOT NULL,
      date_of_birth date NOT NULL,
      age int NOT NULL,

      student_id nvarchar(200) NOT NULL,
      projected_graduation_year nvarchar(50) NOT NULL,
      telephone nvarchar(100) NOT NULL,
      email nvarchar(255) NOT NULL,
      home_address nvarchar(max) NOT NULL,

      faculty_school nvarchar(max) NOT NULL,
      course_of_study nvarchar(max) NOT NULL,
      year_started_utech nvarchar(50) NOT NULL,
      gpa nvarchar(20) NOT NULL,
      programme_type nvarchar(100) NOT NULL,
      programme_mode nvarchar(100) NOT NULL,
      year_in_school nvarchar(50) NOT NULL,
      did_transfer bit NOT NULL DEFAULT 0,
      transfer_programme_name nvarchar(max) NULL,

      sport nvarchar(200) NOT NULL,
      event_position nvarchar(200) NOT NULL,
      major_accomplishments nvarchar(max) NULL,
      national_representative bit NOT NULL DEFAULT 0,
      national_rep_details nvarchar(max) NULL,

      scholarship_tuition bit NOT NULL DEFAULT 0,
      scholarship_accommodation bit NOT NULL DEFAULT 0,
      scholarship_books bit NOT NULL DEFAULT 0,
      photo_id_path nvarchar(max) NULL,
      progress_report_path nvarchar(max) NULL
    );
  `;

  const createFormQuestions = `
    IF OBJECT_ID('sca.form_questions', 'U') IS NULL
    CREATE TABLE sca.form_questions (
      id varchar(36) PRIMARY KEY DEFAULT (CONVERT(varchar(36), NEWID())),
      field_key nvarchar(255) NOT NULL UNIQUE,
      wording nvarchar(max) NOT NULL,
      sort_order int NOT NULL,
      is_active bit NOT NULL DEFAULT 1
    );
  `;

  const alterApplications = `
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sca.scholarship_applications') AND name = 'photo_id_path')
    BEGIN
        ALTER TABLE sca.scholarship_applications ADD photo_id_path nvarchar(max) NULL;
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sca.scholarship_applications') AND name = 'progress_report_path')
    BEGIN
        ALTER TABLE sca.scholarship_applications ADD progress_report_path nvarchar(max) NULL;
    END
  `;

  const createGuardians = `
    IF OBJECT_ID('sca.guardians', 'U') IS NULL
    CREATE TABLE sca.guardians (
      id int IDENTITY(1,1) PRIMARY KEY,
      application_id varchar(36) NOT NULL,
      surname nvarchar(max) NOT NULL,
      first_name nvarchar(max) NOT NULL,
      middle_initial nvarchar(10) NULL,
      relation nvarchar(100) NOT NULL,
      telephone nvarchar(100) NOT NULL,
      address nvarchar(max) NOT NULL,
      CONSTRAINT FK_guardians_application FOREIGN KEY (application_id) REFERENCES sca.scholarship_applications(id) ON DELETE CASCADE
    );
  `;

  const createAffiliations = `
    IF OBJECT_ID('sca.affiliations', 'U') IS NULL
    CREATE TABLE sca.affiliations (
      id int IDENTITY(1,1) PRIMARY KEY,
      application_id varchar(36) NOT NULL,
      name nvarchar(max) NOT NULL,
      CONSTRAINT FK_affiliations_application FOREIGN KEY (application_id) REFERENCES sca.scholarship_applications(id) ON DELETE CASCADE
    );
  `;

  console.log("Running MSSQL migrations...");
  await pool.request().batch(createSchema);
  await pool.request().batch(createUsers);
  await pool.request().batch(createApplications);
  await pool.request().batch(alterApplications);
  await pool.request().batch(createGuardians);
  await pool.request().batch(createAffiliations);
  await pool.request().batch(createFormQuestions);

  // Check if form_questions is empty and seed it
  const checkEmpty = await pool.request().query("SELECT COUNT(*) as count FROM sca.form_questions");
  if (checkEmpty.recordset[0].count === 0) {
    console.log("Seeding default form questions...");
    const defaultQuestions = [
      { fieldKey: "semester1Amount", wording: "Semester 1 Amount", sortOrder: 1 },
      { fieldKey: "semester2Amount", wording: "Semester 2 Amount", sortOrder: 2 },
      { fieldKey: "scholarshipTuition", wording: "Scholarship Towards Tuition", sortOrder: 3 },
      { fieldKey: "scholarshipAccommodation", wording: "Scholarship Towards Accommodation", sortOrder: 4 },
      { fieldKey: "scholarshipBooks", wording: "Scholarship Towards Books", sortOrder: 5 },
      { fieldKey: "surname", wording: "Surname", sortOrder: 6 },
      { fieldKey: "firstName", wording: "First Name", sortOrder: 7 },
      { fieldKey: "middleName", wording: "Middle Name", sortOrder: 8 },
      { fieldKey: "gender", wording: "Gender", sortOrder: 9 },
      { fieldKey: "nationality", wording: "Nationality", sortOrder: 10 },
      { fieldKey: "dateOfBirth", wording: "Date of Birth", sortOrder: 11 },
      { fieldKey: "age", wording: "Age", sortOrder: 12 },
      { fieldKey: "studentId", wording: "Student ID", sortOrder: 13 },
      { fieldKey: "projectedGraduationYear", wording: "Projected Year of Graduation", sortOrder: 14 },
      { fieldKey: "telephone", wording: "Telephone Number", sortOrder: 15 },
      { fieldKey: "email", wording: "Email Address", sortOrder: 16 },
      { fieldKey: "homeAddress", wording: "Home Address", sortOrder: 17 },
      { fieldKey: "facultySchool", wording: "Faculty/School", sortOrder: 18 },
      { fieldKey: "courseOfStudy", wording: "Course of Study", sortOrder: 19 },
      { fieldKey: "yearStartedUtech", wording: "Year Started at UTECH", sortOrder: 20 },
      { fieldKey: "gpa", wording: "GPA", sortOrder: 21 },
      { fieldKey: "programmeType", wording: "Type of Programme", sortOrder: 22 },
      { fieldKey: "programmeMode", wording: "Programme Mode", sortOrder: 23 },
      { fieldKey: "yearInSchool", wording: "Year in School", sortOrder: 24 },
      { fieldKey: "didTransfer", wording: "Did you transfer from another programme?", sortOrder: 25 },
      { fieldKey: "transferProgrammeName", wording: "Name of Previous Programme", sortOrder: 26 },
      { fieldKey: "sport", wording: "Sport", sortOrder: 27 },
      { fieldKey: "eventPosition", wording: "Event/Position", sortOrder: 28 },
      { fieldKey: "majorAccomplishments", wording: "Major Accomplishments (Academic & Sport)", sortOrder: 29 },
      { fieldKey: "nationalRepresentative", wording: "National Representative?", sortOrder: 30 },
      { fieldKey: "nationalRepDetails", wording: "Year and Category (National Representative)", sortOrder: 31 },
      { fieldKey: "photoIdPath", wording: "Upload Photo ID (Image)", sortOrder: 32 },
      { fieldKey: "progressReportPath", wording: "Upload Progress Report (Document)", sortOrder: 33 }
    ];
    for (const q of defaultQuestions) {
      await pool.request()
        .input("fieldKey", q.fieldKey)
        .input("wording", q.wording)
        .input("sortOrder", q.sortOrder)
        .query("INSERT INTO sca.form_questions (field_key, wording, sort_order, is_active) VALUES (@fieldKey, @wording, @sortOrder, 1)");
    }
    console.log("Form questions seeded successfully.");
  }

  console.log("MSSQL migrations complete.");
  await pool.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
