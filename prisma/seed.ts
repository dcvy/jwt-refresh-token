import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await argon2.hash('SuperAdmin@123');

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
      password: hashedPassword,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  const permissions = [
    { key: 'CREATE_USER', description: 'Create a new user' },
    { key: 'UPDATE_USER', description: 'Update an existing user' },
    { key: 'DELETE_USER', description: 'Delete a user' },
    { key: 'VIEW_USER_LIST', description: 'View user list' },
    { key: 'CREATE_ROLE', description: 'Create a new role' },
    { key: 'UPDATE_ROLE', description: 'Update an existing role' },
    { key: 'DELETE_ROLE', description: 'Delete a role' },
    { key: 'VIEW_ROLE_LIST', description: 'View role list' },
    { key: 'CREATE_PERMISSION', description: 'Create a new permission' },
    { key: 'UPDATE_PERMISSION', description: 'Update an existing permission' },
    { key: 'DELETE_PERMISSION', description: 'Delete a permission' },
    { key: 'VIEW_PERMISSION_LIST', description: 'View permission list' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map(async (permission) =>
      prisma.permission.upsert({
        where: { key: permission.key },
        update: {},
        create: permission,
      }),
    ),
  );

  await Promise.all(
    createdPermissions.map(async (permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  console.log('Super Admin & Permissions seeded successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
