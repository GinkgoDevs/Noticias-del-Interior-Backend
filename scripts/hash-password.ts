import * as bcrypt from 'bcrypt';

/**
 * Script para generar hash de contraseñas
 * Uso: npx ts-node scripts/hash-password.ts
 */

async function hashPassword(password: string) {
    const rounds = 10;
    const hash = await bcrypt.hash(password, rounds);
    console.log('\n🔐 Password Hash Generator\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n✅ Copia el hash para usar en tu INSERT SQL\n');
}

// Cambiar esta contraseña según necesites
const password = process.argv[2] || 'admin123';

hashPassword(password).catch(console.error);
