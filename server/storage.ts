import { 
  users, 
  scholarshipApplications,
  guardians,
  affiliations,
  formQuestions,
  type User, 
  type InsertUser,
  type ScholarshipApplication,
  type InsertScholarshipApplication,
  type ScholarshipApplicationWithRelations,
  type Guardian,
  type Affiliation,
  type FormQuestion,
  type InsertFormQuestion
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
  updateApplication(id: string, updates: any): Promise<ScholarshipApplicationWithRelations>;
  searchApplications(query: string): Promise<ScholarshipApplicationWithRelations[]>;

  getFormQuestions(): Promise<FormQuestion[]>;
  saveFormQuestions(questions: InsertFormQuestion[]): Promise<FormQuestion[]>;
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
      const result = await pool.request().input("id", id).query("SELECT TOP(1) * FROM sca.users WHERE id = @id");
      return result.recordset[0] ? mapRowToCamel(result.recordset[0]) as User : undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("username", username).query("SELECT TOP(1) * FROM sca.users WHERE username = @username");
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
          `INSERT INTO sca.users (username, password) OUTPUT inserted.* VALUES (@username, @password)`,
        );
      return mapRowToCamel(result.recordset[0]) as User;
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  private async getGuardiansForApplication(applicationId: string): Promise<Guardian[]> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("applicationId", applicationId).query("SELECT * FROM sca.guardians WHERE application_id = @applicationId");
      return mapRowsToCamel(result.recordset) as unknown as Guardian[];
    }
    return await db.select().from(guardians).where(eq(guardians.applicationId, applicationId));
  }

  private async getAffiliationsForApplication(applicationId: string): Promise<Affiliation[]> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("applicationId", applicationId).query("SELECT * FROM sca.affiliations WHERE application_id = @applicationId");
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
      const result = await pool.request().query("SELECT * FROM sca.scholarship_applications ORDER BY submission_date DESC");
      const apps = mapRowsToCamel(result.recordset) as unknown as ScholarshipApplication[];
      return Promise.all(apps.map((app) => this.enrichApplication(app)));
    }
    const apps = await db.select().from(scholarshipApplications).orderBy(desc(scholarshipApplications.submissionDate));
    return Promise.all(apps.map((app: any) => this.enrichApplication(app)));
  }

  async getApplicationById(id: string): Promise<ScholarshipApplicationWithRelations | undefined> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().input("id", id).query("SELECT TOP(1) * FROM sca.scholarship_applications WHERE id = @id");
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
          insertAppCols.push(`[${camelToSnake(key)}]`);
          insertAppVals.push(`@${param}`);
          inputs[param] = value;
        }

        const insertAppSql = `INSERT INTO sca.scholarship_applications (${insertAppCols.join(",")}) OUTPUT inserted.* VALUES (${insertAppVals.join(",")})`;

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
          gr.input("middle_initial", g.middleInitial ?? null);
          gr.input("relation", g.relation);
          gr.input("telephone", g.telephone);
          gr.input("address", g.address);
          const res = await gr.query(`INSERT INTO sca.guardians (application_id, surname, first_name, middle_initial, relation, telephone, address) OUTPUT inserted.* VALUES (@applicationId, @surname, @first_name, @middle_initial, @relation, @telephone, @address)`);
          insertedGuardians.push(mapRowToCamel(res.recordset[0]));
        }

        const insertedAffiliations: any[] = [];
        if (affiliationData && affiliationData.length > 0) {
          for (const a of affiliationData) {
            const ar = new mssql.Request(transaction);
            ar.input("applicationId", newApplication.id);
            ar.input("name", a.name);
            const res = await ar.query(`INSERT INTO sca.affiliations (application_id, name) OUTPUT inserted.* VALUES (@applicationId, @name)`);
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

    return await db.transaction(async (tx: any) => {
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
        `SELECT * FROM sca.scholarship_applications WHERE first_name LIKE @pat OR surname LIKE @pat OR student_id LIKE @pat OR sport LIKE @pat OR faculty_school LIKE @pat ORDER BY submission_date DESC`
      );
      const apps = mapRowsToCamel(result.recordset) as unknown as ScholarshipApplication[];
      return Promise.all(apps.map(app => this.enrichApplication(app)));
    }

    const apps = await db.select().from(scholarshipApplications).where(
      or(
        ilike(scholarshipApplications.firstName, searchPattern),
        ilike(scholarshipApplications.surname, searchPattern),
        ilike(scholarshipApplications.studentId, searchPattern),
        ilike(scholarshipApplications.sport, searchPattern),
        ilike(scholarshipApplications.facultySchool, searchPattern)
      )
    ).orderBy(desc(scholarshipApplications.submissionDate));
    return Promise.all(apps.map((app: any) => this.enrichApplication(app)));
  }

  async getFormQuestions(): Promise<FormQuestion[]> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const result = await pool.request().query("SELECT * FROM sca.form_questions ORDER BY sort_order ASC");
      return mapRowsToCamel(result.recordset) as unknown as FormQuestion[];
    }
    return await db.select().from(formQuestions).orderBy(formQuestions.sortOrder);
  }

  async saveFormQuestions(questions: InsertFormQuestion[]): Promise<FormQuestion[]> {
    if (useMssql) {
      const pool = await this.ensureMssql();
      const transaction = new mssql.Transaction(pool);
      await transaction.begin();
      try {
        for (const q of questions) {
          const req = new mssql.Request(transaction);
          req.input("fieldKey", q.fieldKey);
          req.input("wording", q.wording);
          req.input("sortOrder", q.sortOrder);
          req.input("isActive", q.isActive ? 1 : 0);
          await req.query(
            `UPDATE sca.form_questions 
             SET wording = @wording, sort_order = @sortOrder, is_active = @isActive 
             WHERE field_key = @fieldKey`
          );
        }
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
      return this.getFormQuestions();
    }

    await db.transaction(async (tx: any) => {
      for (const q of questions) {
        await tx
          .insert(formQuestions)
          .values(q)
          .onConflictDoUpdate({
            target: formQuestions.fieldKey,
            set: { wording: q.wording, sortOrder: q.sortOrder, isActive: q.isActive },
          });
      }
    });
    return this.getFormQuestions();
  }

  async updateApplication(id: string, updates: any): Promise<ScholarshipApplicationWithRelations> {
    const appColumns = new Set([
      "semester1Amount", "semester2Amount", "surname", "firstName", "middleName",
      "gender", "nationality", "dateOfBirth", "age", "studentId", "projectedGraduationYear",
      "telephone", "email", "homeAddress", "facultySchool", "courseOfStudy",
      "yearStartedUtech", "gpa", "programmeType", "programmeMode", "yearInSchool",
      "didTransfer", "transferProgrammeName", "sport", "eventPosition", "majorAccomplishments",
      "nationalRepresentative", "nationalRepDetails", "scholarshipTuition", "scholarshipAccommodation",
      "scholarshipBooks", "photoIdPath", "progressReportPath"
    ]);

    if (useMssql) {
      const pool = await this.ensureMssql();
      const transaction = new mssql.Transaction(pool);
      await transaction.begin();
      try {
        const appUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
          if (appColumns.has(key)) {
            appUpdates[key] = value;
          }
        }

        if (Object.keys(appUpdates).length > 0) {
          const request = new mssql.Request(transaction);
          const setClause: string[] = [];
          let idx = 0;
          for (const [key, value] of Object.entries(appUpdates)) {
            idx += 1;
            const param = `p${idx}`;
            setClause.push(`[${camelToSnake(key)}] = @${param}`);
            request.input(param, value === undefined ? null : value);
          }
          request.input("id", id);
          await request.query(`UPDATE sca.scholarship_applications SET ${setClause.join(", ")} WHERE id = @id`);
        }

        // Handle guardians update
        if (updates.guardians && Array.isArray(updates.guardians)) {
          for (const g of updates.guardians) {
            if (g.id) {
              const gr = new mssql.Request(transaction);
              gr.input("id", g.id);
              gr.input("surname", g.surname);
              gr.input("first_name", g.firstName);
              gr.input("middle_initial", g.middleInitial ?? null);
              gr.input("relation", g.relation);
              gr.input("telephone", g.telephone);
              gr.input("address", g.address);
              await gr.query(`
                UPDATE sca.guardians 
                SET surname = @surname, first_name = @first_name, middle_initial = @middle_initial, 
                    relation = @relation, telephone = @telephone, address = @address 
                WHERE id = @id
              `);
            }
          }
        }

        // Handle affiliations update
        if (updates.affiliations && Array.isArray(updates.affiliations)) {
          for (const a of updates.affiliations) {
            if (a.id) {
              const ar = new mssql.Request(transaction);
              ar.input("id", a.id);
              ar.input("name", a.name);
              await ar.query(`UPDATE sca.affiliations SET name = @name WHERE id = @id`);
            }
          }
        }

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
      return (await this.getApplicationById(id))!;
    }

    // Postgres/drizzle implementation
    await db.transaction(async (tx: any) => {
      const appUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (appColumns.has(key)) {
          appUpdates[key] = value;
        }
      }

      if (Object.keys(appUpdates).length > 0) {
        await tx.update(scholarshipApplications).set(appUpdates).where(eq(scholarshipApplications.id, id));
      }

      if (updates.guardians && Array.isArray(updates.guardians)) {
        for (const g of updates.guardians) {
          if (g.id) {
            const { id: _, ...gData } = g;
            await tx.update(guardians).set(gData).where(eq(guardians.id, g.id));
          }
        }
      }

      if (updates.affiliations && Array.isArray(updates.affiliations)) {
        for (const a of updates.affiliations) {
          if (a.id) {
            const { id: _, ...aData } = a;
            await tx.update(affiliations).set(aData).where(eq(affiliations.id, a.id));
          }
        }
      }
    });

    return (await this.getApplicationById(id))!;
  }
}

export const storage = new DatabaseStorage();
