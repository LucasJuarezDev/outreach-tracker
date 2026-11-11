/**
 * Command-line sync, handy for a scheduled task:
 *   npm run sync
 * Runs with the "react-server" condition so server-only modules load outside Next.js.
 */
import { syncGmail } from "../src/server/gmail/sync";

syncGmail()
  .then((r) => {
    console.log(`Gmail sync: ${r.threads} threads · ${r.created} new · ${r.updated} updated · ${r.skipped} skipped`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Gmail sync failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
