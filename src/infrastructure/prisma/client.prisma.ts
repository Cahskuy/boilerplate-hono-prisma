import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal as NodeJS.Signals, async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}
