// prisma-migrate.ts  — compiled to dist/prisma-migrate.js
// Called by Fly.io release_command before the new instance takes traffic.
import { execSync } from "child_process";

try {
  console.log("Running database migrations…");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("Migrations complete.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
}
