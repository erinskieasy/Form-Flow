import { getPool } from "./mssqlClient";

async function run() {
  const pool = await getPool();

  const createUsers = `
    IF OBJECT_ID('dbo.users', 'U') IS NULL
    CREATE TABLE dbo.users (
      id varchar(36) PRIMARY KEY DEFAULT (CONVERT(varchar(36), NEWID())),
      username nvarchar(255) NOT NULL UNIQUE,
      password nvarchar(1024) NOT NULL
    );
  `;

  const createApplications = `
    IF OBJECT_ID('dbo.scholarship_applications', 'U') IS NULL
    CREATE TABLE dbo.scholarship_applications (
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
      scholarship_books bit NOT NULL DEFAULT 0
    );
  `;

  const createGuardians = `
    IF OBJECT_ID('dbo.guardians', 'U') IS NULL
    CREATE TABLE dbo.guardians (
      id int IDENTITY(1,1) PRIMARY KEY,
      application_id varchar(36) NOT NULL,
      surname nvarchar(max) NOT NULL,
      first_name nvarchar(max) NOT NULL,
      middle_initial nvarchar(10) NULL,
      relation nvarchar(100) NOT NULL,
      telephone nvarchar(100) NOT NULL,
      address nvarchar(max) NOT NULL,
      CONSTRAINT FK_guardians_application FOREIGN KEY (application_id) REFERENCES dbo.scholarship_applications(id) ON DELETE CASCADE
    );
  `;

  const createAffiliations = `
    IF OBJECT_ID('dbo.affiliations', 'U') IS NULL
    CREATE TABLE dbo.affiliations (
      id int IDENTITY(1,1) PRIMARY KEY,
      application_id varchar(36) NOT NULL,
      name nvarchar(max) NOT NULL,
      CONSTRAINT FK_affiliations_application FOREIGN KEY (application_id) REFERENCES dbo.scholarship_applications(id) ON DELETE CASCADE
    );
  `;

  console.log("Running MSSQL migrations...");
  await pool.request().batch(createUsers + '\n' + createApplications + '\n' + createGuardians + '\n' + createAffiliations);
  console.log("MSSQL migrations complete.");
  await pool.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
