import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keep for potential future auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Scholarship Applications table
export const scholarshipApplications = pgTable("scholarship_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Application details
  submissionDate: date("submission_date").notNull().default(sql`CURRENT_DATE`),
  semester1Amount: integer("semester1_amount"),
  semester2Amount: integer("semester2_amount"),
  
  // Personal Information
  surname: text("surname").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  gender: text("gender").notNull(), // 'M' or 'F'
  nationality: text("nationality").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  age: integer("age").notNull(),
  
  // Contact Information
  studentId: text("student_id").notNull(),
  projectedGraduationYear: text("projected_graduation_year").notNull(),
  telephone: text("telephone").notNull(),
  email: text("email").notNull(),
  homeAddress: text("home_address").notNull(),
  
  // Academic Information
  facultySchool: text("faculty_school").notNull(),
  courseOfStudy: text("course_of_study").notNull(),
  yearStartedUtech: text("year_started_utech").notNull(),
  gpa: text("gpa").notNull(),
  programmeType: text("programme_type").notNull(), // 'Undergraduate', 'Graduate', 'Diploma', 'Certificate'
  programmeMode: text("programme_mode").notNull(), // 'Part-time', 'Full-time'
  yearInSchool: text("year_in_school").notNull(), // '1st', '2nd', '3rd', '4th', '5th'
  didTransfer: boolean("did_transfer").notNull().default(false),
  transferProgrammeName: text("transfer_programme_name"),
  
  // Athletic Information
  sport: text("sport").notNull(),
  eventPosition: text("event_position").notNull(),
  majorAccomplishments: text("major_accomplishments"),
  nationalRepresentative: boolean("national_representative").notNull().default(false),
  nationalRepDetails: text("national_rep_details"),
  affiliation: text("affiliation"),
  
  // Scholarship Type
  scholarshipTuition: boolean("scholarship_tuition").notNull().default(false),
  scholarshipAccommodation: boolean("scholarship_accommodation").notNull().default(false),
  scholarshipBooks: boolean("scholarship_books").notNull().default(false),
  
  // Parent/Guardian Information
  parentSurname: text("parent_surname").notNull(),
  parentFirstName: text("parent_first_name").notNull(),
  parentMiddleInitial: text("parent_middle_initial"),
  parentRelation: text("parent_relation").notNull(),
  parentTelephone: text("parent_telephone").notNull(),
  parentAddress: text("parent_address").notNull(),
});

export const insertScholarshipApplicationSchema = createInsertSchema(scholarshipApplications).omit({
  id: true,
  submissionDate: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  gpa: z.string().regex(/^[0-4](\.\d{1,2})?$/, "GPA must be between 0.00 and 4.00"),
  telephone: z.string().min(7, "Please enter a valid phone number"),
  parentTelephone: z.string().min(7, "Please enter a valid phone number"),
  age: z.number().min(16, "Applicant must be at least 16 years old").max(50, "Please enter a valid age"),
});

export type InsertScholarshipApplication = z.infer<typeof insertScholarshipApplicationSchema>;
export type ScholarshipApplication = typeof scholarshipApplications.$inferSelect;
