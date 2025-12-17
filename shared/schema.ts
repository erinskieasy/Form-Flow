import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, serial } from "drizzle-orm/pg-core";
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
  gender: text("gender").notNull(),
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
  programmeType: text("programme_type").notNull(),
  programmeMode: text("programme_mode").notNull(),
  yearInSchool: text("year_in_school").notNull(),
  didTransfer: boolean("did_transfer").notNull().default(false),
  transferProgrammeName: text("transfer_programme_name"),
  
  // Athletic Information
  sport: text("sport").notNull(),
  eventPosition: text("event_position").notNull(),
  majorAccomplishments: text("major_accomplishments"),
  nationalRepresentative: boolean("national_representative").notNull().default(false),
  nationalRepDetails: text("national_rep_details"),
  
  // Scholarship Type
  scholarshipTuition: boolean("scholarship_tuition").notNull().default(false),
  scholarshipAccommodation: boolean("scholarship_accommodation").notNull().default(false),
  scholarshipBooks: boolean("scholarship_books").notNull().default(false),
});

// Guardians table - supports multiple guardians per application
export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  applicationId: varchar("application_id").notNull().references(() => scholarshipApplications.id, { onDelete: "cascade" }),
  surname: text("surname").notNull(),
  firstName: text("first_name").notNull(),
  middleInitial: text("middle_initial"),
  relation: text("relation").notNull(),
  telephone: text("telephone").notNull(),
  address: text("address").notNull(),
});

// Affiliations table - supports multiple affiliations per application
export const affiliations = pgTable("affiliations", {
  id: serial("id").primaryKey(),
  applicationId: varchar("application_id").notNull().references(() => scholarshipApplications.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

// Guardian schemas and types
export const insertGuardianSchema = createInsertSchema(guardians).omit({
  id: true,
  applicationId: true,
}).extend({
  telephone: z.string().min(7, "Please enter a valid phone number"),
});

export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type Guardian = typeof guardians.$inferSelect;

// Affiliation schemas and types
export const insertAffiliationSchema = createInsertSchema(affiliations).omit({
  id: true,
  applicationId: true,
});

export type InsertAffiliation = z.infer<typeof insertAffiliationSchema>;
export type Affiliation = typeof affiliations.$inferSelect;

// Base application schema (without guardians/affiliations)
const baseApplicationSchema = createInsertSchema(scholarshipApplications).omit({
  id: true,
  submissionDate: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  gpa: z.string().regex(/^[0-4](\.\d{1,2})?$/, "GPA must be between 0.00 and 4.00"),
  telephone: z.string().min(7, "Please enter a valid phone number"),
  age: z.number().min(16, "Applicant must be at least 16 years old").max(50, "Please enter a valid age"),
});

// Full application schema with nested guardians and affiliations
export const insertScholarshipApplicationSchema = baseApplicationSchema.extend({
  guardians: z.array(insertGuardianSchema).min(1, "At least one guardian/contact person is required"),
  affiliations: z.array(insertAffiliationSchema).default([]),
});

export type InsertScholarshipApplication = z.infer<typeof insertScholarshipApplicationSchema>;
export type ScholarshipApplication = typeof scholarshipApplications.$inferSelect;

// Full application type with relations for API responses
export type ScholarshipApplicationWithRelations = ScholarshipApplication & {
  guardians: Guardian[];
  affiliations: Affiliation[];
};
