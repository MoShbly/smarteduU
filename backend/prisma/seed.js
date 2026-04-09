import bcrypt from 'bcryptjs';

import prisma from '../src/lib/prisma.js';

const allowedRoles = new Set(['teacher', 'student']);

async function main() {
  await prisma.$connect();

  const name = process.env.SEED_USER_NAME?.trim();
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;
  const role = process.env.SEED_USER_ROLE?.trim().toLowerCase();

  if (!name || !email || !password || !role) {
    console.log('No demo data was seeded.');
    console.log(
      'Register real teacher and student accounts through the app, or provide SEED_USER_* variables to bootstrap one real account.'
    );
    return;
  }

  if (!allowedRoles.has(role)) {
    throw new Error('SEED_USER_ROLE must be either "teacher" or "student".');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      passwordHash,
      role,
      isActive: true
    },
    create: {
      name,
      email,
      passwordHash,
      role,
      isActive: true
    }
  });

  console.log(`Seeded ${user.role} account: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
