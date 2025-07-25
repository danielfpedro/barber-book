const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../src/lib/rbac');

const prisma = new PrismaClient();

async function main() {
  // Create a barber (tenant)
  const barber = await prisma.tenant.create({
    data: {
      name: 'The Barber Shop',
      slug: 'the-barber-shop',
      },
  });
  console.log(`Created barber with ID: ${barber.id}`);

  // Create 25 users (staff) for the barber
  const users = [];
  // Create the first user as TENANT_ADMIN with a specific email
  const firstUserHashedPassword = await bcrypt.hash('password123', 10);
  const firstUser = await prisma.user.create({
    data: {
      tenantId: barber.id,
      email: 'staff@example.com',
      passwordHash: firstUserHashedPassword,
      role: USER_ROLES.TENANT_ADMIN,
    },
  });
  users.push(firstUser);

  // Create the remaining 24 users, half TENANT_ADMIN and half TENANT_STAFF
  for (let i = 0; i < 24; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const role = i < 12 ? USER_ROLES.TENANT_ADMIN : USER_ROLES.TENANT_STAFF;
    const user = await prisma.user.create({
      data: {
        tenantId: barber.id,
        email: faker.internet.email(),
        passwordHash: hashedPassword,
        role: role,
      },
    });
    users.push(user);
  }
  console.log(`Created ${users.length} staff users.`);

  // Create one end user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const endUser = await prisma.endUser.create({
    data: {
      email: 'enduser@example.com',
      passwordHash: hashedPassword,
    },
  });
  console.log(`Created end user with ID: ${endUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
