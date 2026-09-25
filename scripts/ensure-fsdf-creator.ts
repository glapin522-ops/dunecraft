/**
 * One-shot: upsert StoredUser fsdf with role creator in Blob/local users store.
 * Usage (from repo root, with .env.local loaded):
 *   npx tsx --env-file=.env.local scripts/ensure-fsdf-creator.ts
 */
import { ensureCreatorAccount, verifyCredentials } from "../lib/auth/credentials";

const USERNAME = process.env.ENSURE_CREATOR_USERNAME?.trim() || "fsdf";
const PASSWORD = process.env.ENSURE_CREATOR_PASSWORD?.trim() || "Fsdf123!";

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.warn(
      "[ensure-fsdf] BLOB_READ_WRITE_TOKEN not set — will write local data/users.json only",
    );
  }
  const user = await ensureCreatorAccount(USERNAME, PASSWORD);
  console.log("[ensure-fsdf] upserted:", user);

  const verified = await verifyCredentials(USERNAME, PASSWORD);
  if (!verified || verified.role !== "creator") {
    console.error("[ensure-fsdf] verify failed:", verified);
    process.exit(1);
  }
  console.log("[ensure-fsdf] verify OK:", verified);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
