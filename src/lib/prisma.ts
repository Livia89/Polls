import { PrismaClient } from "@prisma/client";

// db connection
export const prisma = new PrismaClient({
  // showing querys when is creating a new registry
  log: ["query"],
});
