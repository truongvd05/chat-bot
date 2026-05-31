import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@chatdemo.site" },
        update: {},
        create: {
            email: process.env.ADMIN_EMAIL,
            name: "Super Admin",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
        },
    });

    console.log("Admin created:", admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
