import { 
  users, 
  scholarshipApplications,
  type User, 
  type InsertUser,
  type ScholarshipApplication,
  type InsertScholarshipApplication
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllApplications(): Promise<ScholarshipApplication[]>;
  getApplicationById(id: string): Promise<ScholarshipApplication | undefined>;
  createApplication(application: InsertScholarshipApplication): Promise<ScholarshipApplication>;
  searchApplications(query: string): Promise<ScholarshipApplication[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllApplications(): Promise<ScholarshipApplication[]> {
    return await db.select().from(scholarshipApplications).orderBy(desc(scholarshipApplications.submissionDate));
  }

  async getApplicationById(id: string): Promise<ScholarshipApplication | undefined> {
    const [application] = await db.select().from(scholarshipApplications).where(eq(scholarshipApplications.id, id));
    return application || undefined;
  }

  async createApplication(application: InsertScholarshipApplication): Promise<ScholarshipApplication> {
    const [newApplication] = await db.insert(scholarshipApplications).values(application).returning();
    return newApplication;
  }

  async searchApplications(query: string): Promise<ScholarshipApplication[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(scholarshipApplications).where(
      or(
        ilike(scholarshipApplications.firstName, searchPattern),
        ilike(scholarshipApplications.surname, searchPattern),
        ilike(scholarshipApplications.studentId, searchPattern),
        ilike(scholarshipApplications.sport, searchPattern),
        ilike(scholarshipApplications.facultySchool, searchPattern)
      )
    ).orderBy(desc(scholarshipApplications.submissionDate));
  }
}

export const storage = new DatabaseStorage();
