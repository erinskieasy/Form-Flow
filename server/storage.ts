import { 
  users, 
  scholarshipApplications,
  guardians,
  affiliations,
  type User, 
  type InsertUser,
  type ScholarshipApplication,
  type InsertScholarshipApplication,
  type ScholarshipApplicationWithRelations,
  type Guardian,
  type Affiliation
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllApplications(): Promise<ScholarshipApplicationWithRelations[]>;
  getApplicationById(id: string): Promise<ScholarshipApplicationWithRelations | undefined>;
  createApplication(application: InsertScholarshipApplication): Promise<ScholarshipApplicationWithRelations>;
  searchApplications(query: string): Promise<ScholarshipApplicationWithRelations[]>;
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

  private async getGuardiansForApplication(applicationId: string): Promise<Guardian[]> {
    return await db.select().from(guardians).where(eq(guardians.applicationId, applicationId));
  }

  private async getAffiliationsForApplication(applicationId: string): Promise<Affiliation[]> {
    return await db.select().from(affiliations).where(eq(affiliations.applicationId, applicationId));
  }

  private async enrichApplication(app: ScholarshipApplication): Promise<ScholarshipApplicationWithRelations> {
    const [appGuardians, appAffiliations] = await Promise.all([
      this.getGuardiansForApplication(app.id),
      this.getAffiliationsForApplication(app.id)
    ]);
    return {
      ...app,
      guardians: appGuardians,
      affiliations: appAffiliations
    };
  }

  async getAllApplications(): Promise<ScholarshipApplicationWithRelations[]> {
    const apps = await db.select().from(scholarshipApplications).orderBy(desc(scholarshipApplications.submissionDate));
    return Promise.all(apps.map(app => this.enrichApplication(app)));
  }

  async getApplicationById(id: string): Promise<ScholarshipApplicationWithRelations | undefined> {
    const [application] = await db.select().from(scholarshipApplications).where(eq(scholarshipApplications.id, id));
    if (!application) return undefined;
    return this.enrichApplication(application);
  }

  async createApplication(application: InsertScholarshipApplication): Promise<ScholarshipApplicationWithRelations> {
    const { guardians: guardianData, affiliations: affiliationData, ...applicationData } = application;
    
    return await db.transaction(async (tx) => {
      const [newApplication] = await tx.insert(scholarshipApplications).values(applicationData).returning();
      
      const insertedGuardians = await Promise.all(
        guardianData.map(g => 
          tx.insert(guardians).values({ ...g, applicationId: newApplication.id }).returning()
        )
      );
      
      let insertedAffiliations: Affiliation[] = [];
      if (affiliationData && affiliationData.length > 0) {
        const affiliationResults = await Promise.all(
          affiliationData.map(a => 
            tx.insert(affiliations).values({ ...a, applicationId: newApplication.id }).returning()
          )
        );
        insertedAffiliations = affiliationResults.map(r => r[0]);
      }
      
      return {
        ...newApplication,
        guardians: insertedGuardians.map(r => r[0]),
        affiliations: insertedAffiliations
      };
    });
  }

  async searchApplications(query: string): Promise<ScholarshipApplicationWithRelations[]> {
    const searchPattern = `%${query}%`;
    const apps = await db.select().from(scholarshipApplications).where(
      or(
        ilike(scholarshipApplications.firstName, searchPattern),
        ilike(scholarshipApplications.surname, searchPattern),
        ilike(scholarshipApplications.studentId, searchPattern),
        ilike(scholarshipApplications.sport, searchPattern),
        ilike(scholarshipApplications.facultySchool, searchPattern)
      )
    ).orderBy(desc(scholarshipApplications.submissionDate));
    return Promise.all(apps.map(app => this.enrichApplication(app)));
  }
}

export const storage = new DatabaseStorage();
