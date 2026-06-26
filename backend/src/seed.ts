import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Impulse@2026', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'rafael.impulseb@gmail.com' },
    update: {},
    create: {
      nome: 'Rafael Coutinho',
      email: 'rafael.impulseb@gmail.com',
      senha: hash,
      role: 'admin',
      ativo: true,
    }
  });
  console.log('Admin criado:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());