import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticatedDev } from "./supabaseAuth";
import { insertEmailSchema, insertCalendarEventSchema, insertRevenueSchema } from "@shared/schema";
import { seedSampleData } from "./seedData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Seed sample data for new users
      if (user) {
        await seedSampleData(userId);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Email routes
  app.get('/api/emails', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const category = req.query.category as string;
      const emails = await storage.getEmails(userId, category);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.get('/api/emails/stats', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getEmailStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching email stats:", error);
      res.status(500).json({ message: "Failed to fetch email stats" });
    }
  });

  app.post('/api/emails', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emailData = insertEmailSchema.parse({ ...req.body, userId });
      const email = await storage.createEmail(emailData);
      res.json(email);
    } catch (error) {
      console.error("Error creating email:", error);
      res.status(500).json({ message: "Failed to create email" });
    }
  });

  app.patch('/api/emails/:id/status', isAuthenticatedDev, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const { category } = req.body;
      await storage.updateEmailStatus(emailId, category);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating email status:", error);
      res.status(500).json({ message: "Failed to update email status" });
    }
  });

  // Calendar routes
  app.get('/api/calendar/events', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const events = await storage.getCalendarEvents(userId, startDate, endDate);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get('/api/calendar/upcoming', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const events = await storage.getUpcomingEvents(userId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.post('/api/calendar/events', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertCalendarEventSchema.parse({ ...req.body, userId });
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  // Revenue routes
  app.get('/api/revenue', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const revenue = await storage.getRevenue(userId, startDate, endDate);
      res.json(revenue);
    } catch (error) {
      console.error("Error fetching revenue:", error);
      res.status(500).json({ message: "Failed to fetch revenue" });
    }
  });

  app.get('/api/revenue/monthly', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const monthlyRevenue = await storage.getMonthlyRevenue(userId);
      res.json(monthlyRevenue);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      res.status(500).json({ message: "Failed to fetch monthly revenue" });
    }
  });

  app.post('/api/revenue', isAuthenticatedDev, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const revenueData = insertRevenueSchema.parse({ ...req.body, userId });
      const revenue = await storage.createRevenue(revenueData);
      res.json(revenue);
    } catch (error) {
      console.error("Error creating revenue:", error);
      res.status(500).json({ message: "Failed to create revenue" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
