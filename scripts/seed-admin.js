import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../src/db/client.js';
import { adminUsers } from '../src/db/schema.js';

const email    = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en .env');
  process.exit(1);
}

if (password.length < 12) {
  console.error('ADMIN_PASSWORD debe tener al menos 12 caracteres');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

await db
  .insert(adminUsers)
  .values({ email, passwordHash })
  .onConflictDoUpdate({
    target: adminUsers.email,
    set: { passwordHash },
  });

console.log(`✓ Admin user ${email} creado/actualizado.`);
process.exit(0);
