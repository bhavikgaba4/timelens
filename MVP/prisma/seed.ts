import { PrismaClient } from "@prisma/client";
import { getDemoData } from "../src/lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  // The two deletions make `npm run db:seed` a dependable reset for demos.
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();

  const demo = getDemoData();
  await prisma.taskHistory.createMany({ data: demo.history });
  await prisma.task.createMany({ data: demo.tasks });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
