import prisma from '../config/prisma';
import { hashPassword } from '../utils/password';

async function main() {
  const email = 'tr@gmail.com';
  const newPassword = 'Password@123';
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password_hash: hashedPassword }
  });

  console.log(`Password for ${email} has been reset to ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
