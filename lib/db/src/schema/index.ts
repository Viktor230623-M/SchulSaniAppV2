import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", [
  "owner",
  "admin",
  "wachleiter",
  "sanitaeter",
]);

export const missionStatusEnum = pgEnum("mission_status", [
  "active",
  "closed",
]);

export const loaStatusEnum = pgEnum("loa_status", [
  "pending",
  "approved",
  "rejected",
]);

export const platformEnum = pgEnum("platform", ["ios", "android"]);

// ─── Permissions ─────────────────────────────────────────────────────────────
// Canonical permission keys used in custom_roles.permissions array
// missions.view | missions.create | missions.close | missions.respond
// duty.view | duty.manage
// loa.view | loa.submit | loa.manage
// news.view | news.post | news.manage
// users.view | users.manage
// roles.assign | roles.create

// ─── Custom Roles ────────────────────────────────────────────────────────────

export const customRolesTable = pgTable("custom_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366F1"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  iservUsername: text("iserv_username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("sanitaeter"),
  customRoleId: uuid("custom_role_id").references(() => customRolesTable.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Sessions ────────────────────────────────────────────────────────────────

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Missions ────────────────────────────────────────────────────────────────

export const missionsTable = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  patientInitials: text("patient_initials").notNull(),
  treatmentNotes: text("treatment_notes").notNull().default(""),
  status: missionStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const missionRespondersTable = pgTable("mission_responders", {
  id: uuid("id").primaryKey().defaultRandom(),
  missionId: uuid("mission_id")
    .notNull()
    .references(() => missionsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  respondedAt: timestamp("responded_at").notNull().defaultNow(),
});

// ─── Duty Slots ──────────────────────────────────────────────────────────────

export const dutySlotsTable = pgTable("duty_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── LOA Requests ────────────────────────────────────────────────────────────

export const loaRequestsTable = pgTable("loa_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  status: loaStatusEnum("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── News ────────────────────────────────────────────────────────────────────

export const newsTable = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Push Tokens ─────────────────────────────────────────────────────────────

export const pushTokensTable = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: platformEnum("platform").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Activity Log ────────────────────────────────────────────────────────────

export const activityLogTable = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  customRole: one(customRolesTable, {
    fields: [usersTable.customRoleId],
    references: [customRolesTable.id],
  }),
  sessions: many(sessionsTable),
  missions: many(missionsTable),
  missionResponses: many(missionRespondersTable),
  dutySlots: many(dutySlotsTable),
  loaRequests: many(loaRequestsTable),
  news: many(newsTable),
  pushTokens: many(pushTokensTable),
}));

export const customRolesRelations = relations(customRolesTable, ({ many }) => ({
  users: many(usersTable),
}));

export const missionsRelations = relations(missionsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [missionsTable.createdBy],
    references: [usersTable.id],
  }),
  responders: many(missionRespondersTable),
}));

export const missionRespondersRelations = relations(
  missionRespondersTable,
  ({ one }) => ({
    mission: one(missionsTable, {
      fields: [missionRespondersTable.missionId],
      references: [missionsTable.id],
    }),
    user: one(usersTable, {
      fields: [missionRespondersTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const dutySlotsRelations = relations(dutySlotsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [dutySlotsTable.userId],
    references: [usersTable.id],
  }),
}));

export const loaRequestsRelations = relations(loaRequestsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [loaRequestsTable.userId],
    references: [usersTable.id],
  }),
  reviewer: one(usersTable, {
    fields: [loaRequestsTable.reviewedBy],
    references: [usersTable.id],
  }),
}));

export const newsRelations = relations(newsTable, ({ one }) => ({
  author: one(usersTable, {
    fields: [newsTable.authorId],
    references: [usersTable.id],
  }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertMissionSchema = createInsertSchema(missionsTable).omit({
  id: true,
  createdAt: true,
  closedAt: true,
});
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;

export const insertDutySlotSchema = createInsertSchema(dutySlotsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDutySlot = z.infer<typeof insertDutySlotSchema>;
export type DutySlot = typeof dutySlotsTable.$inferSelect;

export const insertLoaRequestSchema = createInsertSchema(
  loaRequestsTable,
).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
});
export type InsertLoaRequest = z.infer<typeof insertLoaRequestSchema>;
export type LoaRequest = typeof loaRequestsTable.$inferSelect;

export const insertNewsSchema = createInsertSchema(newsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof newsTable.$inferSelect;

export const insertCustomRoleSchema = createInsertSchema(customRolesTable).omit(
  {
    id: true,
    createdAt: true,
    createdBy: true,
  },
);
export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;
export type CustomRole = typeof customRolesTable.$inferSelect;
