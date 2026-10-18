import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { db } from "./index";
import { users, type Role } from "./schema";

export const MOCK_PASSWORD = "Password123!";

const MOCK_ACCOUNTS: { email: string; name: string; role: Role; contact: string; unitNo: string | null }[] = [
  { email: "visitor@gatepass.test", name: "Vera Visitor", role: "visitor", contact: "0917 000 0001", unitNo: null },
  { email: "tenant@gatepass.test", name: "Tito Tenant", role: "tenant", contact: "0917 000 0002", unitNo: "Unit 101" },
  { email: "admin@gatepass.test", name: "Ana Admin", role: "admin", contact: "0917 000 0003", unitNo: null },
];

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: existing, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  for (const { email, ...fields } of MOCK_ACCOUNTS) {
    let user = existing.users.find((u) => u.email === email);
    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({ email, password: MOCK_PASSWORD, email_confirm: true });
      if (error) throw error;
      user = data.user;
    }
    await db
      .insert(users)
      .values({ authId: user.id, email, ...fields })
      .onConflictDoUpdate({ target: users.email, set: { authId: user.id, ...fields } });
    console.log(`Seeded ${fields.role.padEnd(8)} ${email}`);
  }
  console.log(`Password for all mock accounts: ${MOCK_PASSWORD}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});