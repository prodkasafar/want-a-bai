import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const envPath = path.join(__dirname, '../.env');

const postgresConfig = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

const sqliteConfig = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;

function main() {
  const args = process.argv.slice(2);
  const dbUrl = args[0];

  if (!fs.existsSync(schemaPath)) {
    console.error('Error: schema.prisma not found at', schemaPath);
    process.exit(1);
  }

  let schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Replace sqlite datasource configuration with postgres
  if (schemaContent.includes('provider = "sqlite"')) {
    schemaContent = schemaContent.replace(/datasource db \{[\s\S]*?\}/, postgresConfig);
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log('Successfully updated schema.prisma to use PostgreSQL!');
  } else {
    console.log('schema.prisma is already configured for PostgreSQL (or not using SQLite).');
  }

  // Update .env file
  if (dbUrl) {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${dbUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${dbUrl}"\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Successfully updated DATABASE_URL in backend/.env!');
  } else {
    console.log('No connection string provided. Please set DATABASE_URL in your backend/.env file manually.');
  }
}

main();
