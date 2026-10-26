import * as z from "zod";

const DateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a visit date." })
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), { error: "Choose a visit date." });

export const NewRequestSchema = z.object({
  hostName: z.string().trim().min(2, { error: "Enter the tenant's full name." }),
  unitNo: z.string().trim().min(1, { error: "Enter the tenant's room number." }),
  visitDate: DateKey,
  purpose: z.string().trim().min(3, { error: "Enter the purpose of the visit." }),
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
