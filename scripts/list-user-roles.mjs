import { PrismaClient } from "@prisma/client";

const database = new PrismaClient();
try {
  const users = await database.user.findMany({
    select: { email: true, name: true, role: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  console.table(users);
  console.log("Installation:", await database.installationState.findUnique({ where: { id: "primary" }, select: { installed: true, installedAt: true } }));
} finally {
  await database.$disconnect();
}
