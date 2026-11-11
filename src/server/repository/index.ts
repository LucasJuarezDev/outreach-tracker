import "server-only";
import { config } from "../config";
import { demoRepository } from "./demo";
import { prismaRepository } from "./prisma";
import type { Repository } from "./types";

export function getRepository(): Repository {
  return config.demoMode ? demoRepository : prismaRepository;
}

export type { GmailConnection, Repository } from "./types";
