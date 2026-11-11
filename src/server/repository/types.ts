import type { CompanyPatch, Outcome, Outreach } from "@/lib/types";

export interface GmailConnection {
  email: string;
  lastSyncAt: Date | null;
}

/** Storage boundary: the UI never knows whether it talks to SQLite or to demo data. */
export interface Repository {
  listOutreaches(): Promise<Outreach[]>;
  getOutreach(id: string): Promise<Outreach | null>;
  setOutcome(id: string, outcome: Outcome): Promise<void>;
  setNotes(id: string, notes: string | null): Promise<void>;
  updateCompany(id: string, patch: CompanyPatch): Promise<void>;
  getGmailConnection(): Promise<GmailConnection | null>;
}
