import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { randomInt, timingSafeEqual } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { env } from '../config/env';
import { configureDns } from '../config/dns';
import { AppError } from '../modules/shared/errors/app-error';
import { User } from '../modules/users/models/user.model';
import {
  logEmailDeliveryFailure,
  sendAdminBootstrapCode,
} from '../modules/auth/services/email.service';
import {
  bootstrapPrimaryAdmin,
  isPrimaryAdminBootstrapComplete,
} from '../modules/auth/services/admin-bootstrap.service';

function ask(question: string): Promise<string> {
  const readline = createInterface({ input: stdin, output: stdout });
  return readline.question(question).finally(() => readline.close());
}

function askHidden(question: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Administrator bootstrap requires an interactive terminal.'));
  }

  return new Promise((resolve, reject) => {
    const wasPaused = stdin.isPaused();
    let value = '';
    stdout.write(question);

    const cleanup = (): void => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      if (wasPaused) stdin.pause();
      stdout.write('\n');
    };

    const onData = (chunk: Buffer | string): void => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          cleanup();
          reject(new Error('Administrator bootstrap was cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          setImmediate(() => {
            cleanup();
            resolve(value);
          });
          return;
        }
        if (character === '\u0008' || character === '\u007f') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
    stdin.resume();
  });
}

async function connectWithoutLoggingCredentials(): Promise<void> {
  configureDns();
  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
    serverSelectionTimeoutMS: 5_000,
  });
}

async function run(): Promise<void> {
  if (!env.adminEmail) {
    throw new Error('Configure ADMIN_EMAIL before running administrator bootstrap.');
  }
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Administrator bootstrap requires an interactive terminal.');
  }

  await connectWithoutLoggingCredentials();
  try {
    const existingPrimary = await User.findOne({ isPrimaryAdmin: true }).exec();
    if (isPrimaryAdminBootstrapComplete(existingPrimary, env.adminEmail)) {
      console.info('La cuenta administradora principal ya está inicializada.');
      return;
    }

    const code = randomInt(100_000, 1_000_000).toString();
    try {
      await sendAdminBootstrapCode({ to: env.adminEmail, code });
    } catch (error: unknown) {
      logEmailDeliveryFailure(error, 'admin_bootstrap');
      throw new Error('No se pudo enviar el código de confirmación al administrador.');
    }
    console.info('Se envió un código al correo configurado para confirmar su propiedad.');

    const codeSentAt = Date.now();
    const firstName = (await ask('Nombre del administrador: ')).trim();
    const lastName = (await ask('Apellido del administrador: ')).trim();
    const enteredCode = await askHidden('Código de confirmación: ');
    if (Date.now() - codeSentAt > 10 * 60 * 1000) {
      throw new Error('El código de confirmación expiró.');
    }
    if (
      enteredCode.length !== code.length ||
      !timingSafeEqual(Buffer.from(enteredCode), Buffer.from(code))
    ) {
      throw new Error('El código de confirmación no es válido.');
    }

    const password = await askHidden('Nueva contraseña (mínimo 12 caracteres): ');
    const confirmation = await askHidden('Confirma la nueva contraseña: ');
    if (password.length < 12 || password !== confirmation) {
      throw new Error('La contraseña no cumple el mínimo o las confirmaciones no coinciden.');
    }

    await bootstrapPrimaryAdmin({
      email: env.adminEmail,
      firstName,
      lastName,
      password,
    });
    console.info('La cuenta administradora principal quedó inicializada.');
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error: unknown) => {
  console.error(
    error instanceof AppError ? error.message : 'No se pudo completar el bootstrap administrativo.',
  );
  process.exitCode = 1;
});
