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
import { getPool, mssql, mapRowToCamel, mapRowsToCamel, camelToSnake } from "./mssqlClient";

const useMssql = !!process.env.MSSQL_CONNECTION;

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
  private mssqlPool: any | null = null;

  private async ensureMssql() {
    if (!useMssql) return null;
    if (!this.mssqlPool) {
      this.mssqlPool = await getPool();
    }
    return this.mssqlPool;
  }
  async getUser(id: string): Promise<User | undefined> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("id", id).query("SELECT TOP(1) * FROM dbo.users WHERE id = @id");
      return result.recordset[0] ? mapRowToCamel(result.recordset[0]) as User : undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("username", username).query("SELECT TOP(1) * FROM dbo.users WHERE username = @username");
      return result.recordset[0] ? mapRowToCamel(result.recordset[0]) as User : undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool
        .request()
        .input("username", insertUser.username)
        .input("password", insertUser.password)
        .query(
          `INSERT INTO dbo.users (username, password) OUTPUT inserted.* VALUES (@username, @password)`,
        );
      return mapRowToCamel(result.recordset[0]) as User;
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  private async getGuardiansForApplication(applicationId: string): Promise<Guardian[]> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("applicationId", applicationId).query("SELECT * FROM dbo.guardians WHERE application_id = @applicationId");
      return mapRowsToCamel(result.recordset) as unknown as Guardian[];
    }
    return await db.select().from(guardians).where(eq(guardians.applicationId, applicationId));
  }

  private async getAffiliationsForApplication(applicationId: string): Promise<Affiliation[]> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("applicationId", applicationId).query("SELECT * FROM dbo.affiliations WHERE application_id = @applicationId");
      return mapRowsToCamel(result.recordset) as unknown as Affiliation[];
    }
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
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().query("SELECT * FROM dbo.scholarship_applications ORDER BY submission_date DESC");
      const apps = mapRowsToCamel(result.recordset) as unknown as ScholarshipApplication[];
      return Promise.all(apps.map((app) => this.enrichApplication(app)));
    }
    const apps = await db.select().from(scholarshipApplications).orderBy(desc(scholarshipApplications.submissionDate));
    return Promise.all(apps.map(app => this.enrichApplication(app)));
  }

  async getApplicationById(id: string): Promise<ScholarshipApplicationWithRelations | undefined> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("id", id).query("SELECT TOP(1) * FROM dbo.scholarship_applications WHERE id = @id");
      const applicationRow = result.recordset[0];
      if (!applicationRow) return undefined;
      const application = mapRowToCamel(applicationRow) as unknown as ScholarshipApplication;
      return this.enrichApplication(application);
    }
    const [application] = await db.select().from(scholarshipApplications).where(eq(scholarshipApplications.id, id));
    if (!application) return undefined;
    return this.enrichApplication(application);
  }

  async createApplication(application: InsertScholarshipApplication): Promise<ScholarshipApplicationWithRelations> {
    const { guardians: guardianData, affiliations: affiliationData, ...applicationData } = application;

    if (useMssql) {
      const pool = await this.ensureMssql();
      const transaction = new mssql.Transaction(pool);
      await transaction.begin();
      try {
        const request = new mssql.Request(transaction);

        // Build insert for scholarship_applications - map fields explicitly
        const insertAppCols: string[] = [];
        const insertAppVals: string[] = [];
        const inputs: Record<string, any> = {};
        let idx = 0;
        for (const [key, value] of Object.entries(applicationData)) {
          idx += 1;
          const param = `p${idx}`;
          // convert camelCase keys to snake_case DB columns
          insertAppCols.push(`[${camelToSnake(key)}]`);
          insertAppVals.push(`@${param}`);
          inputs[param] = value;
        }

        const insertAppSql = `INSERT INTO dbo.scholarship_applications (${insertAppCols.join(",")}) OUTPUT inserted.* VALUES (${insertAppVals.join(",")})`;

        const req = request;
        for (const [k, v] of Object.entries(inputs)) {
          req.input(k, v as any);
        }

        const appResult = await req.query(insertAppSql);
        const newApplicationRow = appResult.recordset[0];
        const newApplication = mapRowToCamel(newApplicationRow) as unknown as ScholarshipApplication;

        const insertedGuardians: any[] = [];
        for (const g of guardianData) {
          const gr = new mssql.Request(transaction);
          gr.input("applicationId", newApplication.id);
          gr.input("surname", g.surname);
          gr.input("first_name", g.firstName);
          gr.input("middle_initial", g.middleInitial);
          gr.input("relation", g.relation);
          gr.input("telephone", g.telephone);
          gr.input("address", g.address);
          const res = await gr.query(`INSERT INTO dbo.guardians (application_id, surname, first_name, middle_initial, relation, telephone, address) OUTPUT inserted.* VALUES (@applicationId, @surname, @first_name, @middle_initial, @relation, @telephone, @address)`);
          insertedGuardians.push(mapRowToCamel(res.recordset[0]));
        }

        const insertedAffiliations: any[] = [];
        if (affiliationData && affiliationData.length > 0) {
          for (const a of affiliationData) {
            const ar = new mssql.Request(transaction);
            ar.input("applicationId", newApplication.id);
            ar.input("name", a.name);
            const res = await ar.query(`INSERT INTO dbo.affiliations (application_id, name) OUTPUT inserted.* VALUES (@applicationId, @name)`);
            insertedAffiliations.push(mapRowToCamel(res.recordset[0]));
          }
        }

        await transaction.commit();
        return {
          ...newApplication,
          guardians: insertedGuardians as unknown as Guardian[],
          affiliations: insertedAffiliations as unknown as Affiliation[],
        } as ScholarshipApplicationWithRelations;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

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
    if (useMssql) {
      const pool = await this.ensureMssql();
      const pat = `%${query}%`;
      const result = await pool.request().input("pat", pat).query(
        `SELECT * FROM dbo.scholarship_applications WHERE first_name LIKE @pat OR surname LIKE @pat OR student_id LIKE @pat OR sport LIKE @pat OR faculty_school LIKE @pat ORDER BY submission_date DESC`
      );
      const apps = mapRowsToCamel(result.recordset) as unknown as ScholarshipApplication[];
      return Promise.all(apps.map(app => this.enrichApplication(app)));
    }

    const apps = await db.select().from(scholarship_applications).where(
      or(
        ilike(scholarship_applications.firstName, searchPattern),
        ilike(scholarship_applications.surname, searchPattern),
        ilike(scholarship_applications.studentId, searchPattern),
        ilike(scholarship_applications.sport, searchPattern),
        ilike(scholarship_applications.facultySchool, searchPattern)
      )
    ).orderBy(desc(scholarship_applications.submissionDate));
    return Promise.all(apps.map(app => this.enrichApplication(app)));
  }
}

export const storage = new DatabaseStorage();
