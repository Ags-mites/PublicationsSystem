import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('� Starting database seeding...');

    const defaultUsers = [
        {
            email: 'admin@test.com',
            password: 'Admin123!',
            firstName: 'System',
            lastName: 'Administrator',
            roles: ['ROLE_ADMIN'],
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
            email: 'editor@test.com',
            password: 'Editor123!',
            firstName: 'Editorial',
            lastName: 'Manager',
            roles: ['ROLE_EDITOR'],
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
            email: 'author@test.com',
            password: 'Author123!',
            firstName: 'John',
            lastName: 'Author',
            roles: ['ROLE_AUTHOR'],
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
            email: 'reviewer@test.com',
            password: 'Reviewer123!',
            firstName: 'Jane',
            lastName: 'Reviewer',
            roles: ['ROLE_REVIEWER'],
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
            email: 'reader@test.com',
            password: 'Reader123!',
            firstName: 'Public',
            lastName: 'Reader',
            roles: ['ROLE_READER'],
            affiliation: 'General Public',
        },
    ];

    for (const userData of defaultUsers) {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (!existingUser) {
            const password = await bcrypt.hash(userData.password, 12);

            await prisma.user.create({
                data: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password,
                    roles: userData.roles as any,
                    affiliation: userData.affiliation,
                    isActive: true,
                    emailVerified: true,
                },
            });

            console.log(`✅ Created user: ${userData.email}`);
        } else {
            console.log(`⚠️  User already exists: ${userData.email}`);
        }
    }

    console.log('� Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });