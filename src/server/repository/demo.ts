import "server-only";
import { generateDemoOutreaches } from "@/lib/demo-data";
import type { Outreach } from "@/lib/types";
import type { Repository } from "./types";

/**
 * In-memory data for the public demo. Edits live only in this server
 * instance's memory and reset on redeploy or cold start, which is the point.
 */
let store: Outreach[] | null = null;

function data(): Outreach[] {
  store ??= generateDemoOutreaches(new Date());
  return store;
}

function find(id: string): Outreach {
  const item = data().find((o) => o.id === id);
  if (!item) throw new Error(`Outreach ${id} not found`);
  return item;
}

export const demoRepository: Repository = {
  async listOutreaches() {
    return data();
  },
  async getOutreach(id) {
    return data().find((o) => o.id === id) ?? null;
  },
  async setOutcome(id, outcome) {
    find(id).outcome = outcome;
  },
  async setNotes(id, notes) {
    find(id).notes = notes;
  },
  async updateCompany(id, patch) {
    for (const o of data()) {
      if (o.company.id === id) Object.assign(o.company, patch);
    }
  },
  async getGmailConnection() {
    return { email: "demo@exportai.example", lastSyncAt: new Date() };
  },
};
