import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Super Admin',
      description: 'Highest level administrator',
      isSuperAdmin: true,
    },
  });

  const superAdminUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      username: 'superadmin',
      email: 'admin@example.com',
      password: 'hashed_password', // Replace with a securely hashed password
    },
  });

  await prisma.userRole.upsert({
    where: { userId: 1 },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('Super Admin seeded successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
