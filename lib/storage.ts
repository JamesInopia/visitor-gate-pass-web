import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "id-images";
export const MAX_ID_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export const isAllowedIdImage = (file: File) => file.type in TYPES && file.size > 0 && file.size <= MAX_ID_IMAGE_BYTES;

let ready: Promise<void> | null = null;
function ensureBucket() {
  ready ??= (async () => {
    const { error } = await createAdminClient().storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_ID_IMAGE_BYTES,
    });
    if (error && !/already exists/i.test(error.message)) {
      ready = null;
      throw error;
    }
  })();
  return ready;
}

export async function saveIdImage(visitorId: number, file: File): Promise<string> {
  await ensureBucket();
  const path = `${visitorId}/${crypto.randomUUID()}.${TYPES[file.type]}`;
  const { error } = await createAdminClient().storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export async function removeIdImage(path: string | null | undefined) {
  if (!path) return;
  await createAdminClient().storage.from(BUCKET).remove([path]).catch((e) => console.error("removeIdImage", e));
}
