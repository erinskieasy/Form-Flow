import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScholarshipApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { runMssqlMigration } from "./migrate-mssql-fn";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const router = express.Router();

  const storageDir = path.join(process.cwd(), "student_assets");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Serve static files from student_assets under "/student_assets" and "/scholarship/student_assets"
  app.use("/student_assets", express.static(storageDir));
  app.use("/scholarship/student_assets", express.static(storageDir));

  const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, storageDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: fileStorage });

  const verifyAdminPassword = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminPassword = process.env.admin_passwword || process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.warn("WARNING: admin_passwword is not set in the .env file.");
      return res.status(500).json({ message: "Admin password is not configured on the server." });
    }

    const providedPassword = req.headers["x-admin-password"];
    if (providedPassword !== adminPassword) {
      return res.status(401).json({ message: "Unauthorized: Invalid or missing admin password" });
    }

    next();
  };

  router.post("/api/admin/verify-password", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.admin_passwword || process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.warn("WARNING: admin_passwword is not set in the .env file.");
      return res.status(500).json({ message: "Admin password is not configured on the server." });
    }

    if (password === adminPassword) {
      return res.json({ success: true });
    }

    return res.status(401).json({ message: "Incorrect password" });
  });
  
  router.post("/api/admin/migrate-mssql", async (req, res) => {
    try {
      await runMssqlMigration();
      res.json({ message: "Migration complete" });
    } catch (error: any) {
      console.error("Migration failed:", error);
      res.status(500).json({ message: error?.message || "Migration failed" });
    }
  });

  router.get("/api/admin/debug-conn", async (req, res) => {
    const raw = process.env.MSSQL_CONNECTION || "";
    const parts: Record<string, string> = {};
    for (const segment of raw.split(";")) {
      const idx = segment.indexOf("=");
      if (idx < 0) continue;
      const key = segment.slice(0, idx).trim().toLowerCase();
      const value = segment.slice(idx + 1).trim();
      parts[key] = value;
    }
    res.json({ 
      length: raw.length, 
      keys: Object.keys(parts),
      server: parts["server"] || parts["data source"] || null,
      database: parts["database"] || parts["initial catalog"] || null,
      user: parts["user id"] || parts["uid"] || null,
      hasPassword: !!(parts["password"] || parts["pwd"])
    });
  });

  router.get("/api/applications", verifyAdminPassword, async (req, res) => {
    try {
      const { search } = req.query;
      
      let applications;
      if (search && typeof search === "string" && search.trim()) {
        applications = await storage.searchApplications(search.trim());
      } else {
        applications = await storage.getAllApplications();
      }
      
      res.json(applications);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  router.get("/api/applications/:id", verifyAdminPassword, async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Failed to fetch application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  router.post("/api/applications", async (req, res) => {
    try {
      const validationResult = insertScholarshipApplicationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const application = await storage.createApplication(validationResult.data);
      res.status(201).json(application);
    } catch (error) {
      console.error("Failed to create application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  router.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ filePath: `/student_assets/${req.file.filename}` });
  });

  router.get("/api/form-questions", async (req, res) => {
    try {
      const questions = await storage.getFormQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Failed to fetch form questions:", error);
      res.status(500).json({ message: "Failed to fetch form questions" });
    }
  });

  router.post("/api/form-questions", verifyAdminPassword, async (req, res) => {
    try {
      const questions = req.body;
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid payload: expected an array of questions" });
      }
      const saved = await storage.saveFormQuestions(questions);
      res.json(saved);
    } catch (error) {
      console.error("Failed to save form questions:", error);
      res.status(500).json({ message: "Failed to save form questions" });
    }
  });

  router.patch("/api/applications/:id", verifyAdminPassword, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateApplication(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.use(router);
  app.use("/scholarship", router);

  return httpServer;
}
