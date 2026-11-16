import * as z from "zod";

const DateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a visit date." })
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), {
    error: "Choose a visit date.",
  });

export const NewRequestSchema = z.object({
  hostName: z
    .string()
    .trim()
    .min(2, { error: "Enter the tenant's full name." }),
  unitNo: z
    .string()
    .trim()
    .min(1, { error: "Enter the tenant's room number." }),
  visitDate: DateKey,
  purpose: z
    .string()
    .trim()
    .min(3, { error: "Enter the purpose of the visit." }),
  contact: z.string().trim().min(5, { error: "Enter a contact number." }),
});

export const RespondSchema = z.discriminatedUnion(
  "decision",
  [
    z.object({
      decision: z.literal("approve"),
      startsAt: z.coerce.date({ error: "Enter a valid start time." }),
      expiresAt: z.coerce.date({ error: "Enter a valid end time." }),
    }),
    z.object({ decision: z.literal("deny") }),
  ],
  { error: "Choose approve or deny." },
);

// "1001", "unit 1001" and "Unit  1001" all become "Unit 1001", the format tenants are stored in.
export const normalizeUnitNo = (value: string) => {
  const s = value.trim().replace(/\s+/g, " ");
  const m = /^(?:unit\s*)?(\d+[a-z]?)$/i.exec(s);
  return m ? `Unit ${m[1].toUpperCase()}` : s;
};

export const TenantApplicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Enter your full name." })
    .max(100, { error: "That name is too long." }),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Enter a valid email address." })),
  unitNo: z
    .string()
    .trim()
    .min(1, { error: "Enter your room number, e.g. Unit 1001." })
    .max(20, { error: "That room number is too long." })
    .regex(/\d/, { error: "Enter your room number, e.g. Unit 1001." })
    .transform(normalizeUnitNo),
});

export const ApplicationDecisionSchema = z.discriminatedUnion(
  "decision",
  [
    z.object({ decision: z.literal("approve") }),
    z.object({
      decision: z.literal("reject"),
      note: z.string().trim().max(300, { error: "Keep the note under 300 characters." }).optional(),
    }),
  ],
  { error: "Choose approve or reject." },
);
