import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emails table for sponsorship communications
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  senderName: varchar("sender_name").notNull(),
  senderEmail: varchar("sender_email").notNull(),
  category: varchar("category").notNull(), // pending, important, accepted, rejected
  sponsorshipAmount: integer("sponsorship_amount"),
  deadline: timestamp("deadline"),
  aiSummary: text("ai_summary"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  status: varchar("status").notNull(), // scheduled, completed, cancelled
  eventType: varchar("event_type").notNull(), // shooting, meeting, content
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue tracking table
export const revenue = pgTable("revenue", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  source: varchar("source").notNull(),
  description: text("description"),
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertRevenue = typeof revenue.$inferInsert;
export type Revenue = typeof revenue.$inferSelect;

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueSchema = createInsertSchema(revenue).omit({
  id: true,
  createdAt: true,
});
