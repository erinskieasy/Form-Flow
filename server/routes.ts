import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScholarshipApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/applications", async (req, res) => {
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

  app.get("/api/applications/:id", async (req, res) => {
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

  app.post("/api/applications", async (req, res) => {
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

  return httpServer;
}
