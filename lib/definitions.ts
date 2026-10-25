import * as z from "zod";

// POST /api/requests (multipart text fields; the photo is validated separately)
export const NewRequestSchema = z.object({
  hostName: z.string().trim().min(2, { error: "Enter the tenant's full name." }),
  unitNo: z.string().trim().min(1, { error: "Enter the tenant's room number." }),
  purpose: z.string().trim().min(3, { error: "Enter the purpose of the visit." }),
  contact: z.string().trim().min(5, { error: "Enter a contact number." }),
});

// PATCH /api/requests/:id (tenant). expiresAt is only read for "approve"; default is 24 hours.
export const RespondSchema = z.object({
  decision: z.enum(["approve", "deny"], { error: "Choose approve or deny." }),
  expiresAt: z.coerce.date({ error: "Enter a valid expiry date." }).optional(),
});
