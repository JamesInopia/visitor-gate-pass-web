import { sql } from "drizzle-orm";
import { bigint, check, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
 
export const ROLES = ["visitor", "tenant", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable(
  "users",
  {
    userId: bigint("userId", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    authId: uuid("auth_id").unique(), 
    name: text("name").notNull(),
    role: text("role", { enum: ROLES }).notNull(),
    email: text("email").unique(),
    contact: text("contact"),
    unitNo: text("unitNo"),
  },
  (t) => [check("users_role_check", sql`${t.role} in ('tenant','visitor','admin')`)],
);

export const visitorRequest = pgTable(
  "visitor_request",
  {
    requestId: bigint("requestId", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    visitorId: bigint("visitorId", { mode: "number" }).notNull().references(() => users.userId),
    hostId: bigint("hostId", { mode: "number" }).notNull().references(() => users.userId),
    profilePicture: text("profilePicture"),
    visitDuration: timestamp("visitDuration", { withTimezone: true }),
    purposeOfVisit: text("purposeOfVisit"),
    idImageUrl: text("idImageUrl"),
    status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] }).notNull().default("pending"),
    requestedAt: timestamp("requestedAt", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("respondedAt", { withTimezone: true }),
  },
  (t) => [
    check("visitor_request_status_check", sql`${t.status} in ('pending','approved','rejected','cancelled')`),
    index("visitor_request_visitorId_idx").on(t.visitorId),
    index("visitor_request_hostId_idx").on(t.hostId),
  ],
);

export const gatePass = pgTable(
  "gate_pass",
  {
    passId: bigint("passId", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    requestId: bigint("requestId", { mode: "number" })
      .notNull()
      .references(() => visitorRequest.requestId, { onDelete: "cascade" }),
    code: text("code").notNull(),
    expiryDate: timestamp("expiryDate", { withTimezone: true }),
    issuedAt: timestamp("issuedAt", { withTimezone: true }).notNull().defaultNow(),
    status: text("status", { enum: ["active", "used", "expired", "revoked"] }).notNull().default("active"),
  },
  (t) => [
    unique("gate_pass_requestId_key").on(t.requestId),
    unique("gate_pass_code_key").on(t.code),
    check("gate_pass_status_check", sql`${t.status} in ('active','used','expired','revoked')`),
  ],
);

export const entryLog = pgTable(
  "entry_log",
  {
    entryId: bigint("entryId", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    passId: bigint("passId", { mode: "number" }).notNull().references(() => gatePass.passId, { onDelete: "cascade" }),
    adminId: bigint("adminId", { mode: "number" }).notNull().references(() => users.userId),
    dateEnter: timestamp("dateEnter", { withTimezone: true }),
    dateExit: timestamp("dateExit", { withTimezone: true }),
  },
  (t) => [index("entry_log_passId_idx").on(t.passId), index("entry_log_adminId_idx").on(t.adminId)],
);


export const archives = pgTable("archives", {
  logId: bigint("logId", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  visitorName: text("visitorName"),
  contact: text("contact"),
  unitVisited: text("unitVisited"),
  dateEnter: timestamp("dateEnter", { withTimezone: true }),
  dateExit: timestamp("dateExit", { withTimezone: true }),
  visitPurpose: text("visitPurpose"),
  authBy: text("authBy"),
  archivedAt: timestamp("archivedAt", { withTimezone: true }).notNull().defaultNow(),
});