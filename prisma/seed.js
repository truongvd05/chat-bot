import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("Admin@123456", 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@chatdemo.site" },
        update: {},
        create: {
            email: "admin@chatdemo.site",
            name: "Super Admin",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
        },
    });

    console.log(" Admin created:", admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
