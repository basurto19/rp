#!/usr/bin/env node
// scripts/setup.ts
// Script de configuración inicial del ERP

import dotenv from 'dotenv';

dotenv.config();

function validateEnv(): boolean {
  const required = ['MONGODB_URI', 'MONGODB_DB_NAME', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  let valid = true;

  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Variable de entorno faltante: ${key}`);
      valid = false;
    } else {
      console.log(`✅ ${key} configurado`);
    }
  }

  return valid;
}

function printSetupInstructions(): void {
  console.log(`
=========================================
  SETUP DEL ERP - INSTRUCCIONES
=========================================

1. Crear cuenta en MongoDB Atlas: https://www.mongodb.com/atlas
2. Crear un proyecto y un cluster gratuito
3. Crear un usuario de base de datos
4. Agregar tu IP a Network Access (0.0.0.0/0 para desarrollo)
5. Obtener la cadena de conexión MONGODB_URI
6. Copiar el valor en .env

Variables de entorno necesarias:
- MONGODB_URI: Cadena de conexión de MongoDB Atlas
- MONGODB_DB_NAME: Nombre de la base de datos (ej: "erp-system")
- JWT_SECRET: Clave secreta de 32+ caracteres
- JWT_REFRESH_SECRET: Diferente clave secreta de 32+ caracteres

Para generar secretos:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

=========================================
  `);
}

if (require.main === module) {
  console.log('🔧 Verificando configuración del ERP...\n');
  const valid = validateEnv();
  if (!valid) {
    printSetupInstructions();
    process.exit(1);
  }
  console.log('\n✅ Configuración válida. Ejecuta: pnpm dev');
}
