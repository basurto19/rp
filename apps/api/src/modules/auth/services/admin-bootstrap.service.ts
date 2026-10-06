import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ROLES } from '@erp/constants';
import { env } from '../../../config/env';
import { Company } from '../../companies/models/company.model';
import { Token } from '../models/token.model';
import { Role } from '../../roles/models/role.model';
import { User } from '../../users/models/user.model';
import { AppError } from '../../shared/errors/app-error';
import { generateTenantId } from '../../shared/utils';
import { copyPrimaryAdminPermissions } from './primary-admin-permissions';

interface PrimaryAdminInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export function isPrimaryAdminBootstrapComplete(
  existingPrimary: { email: string } | null,
  adminEmail: string,
): boolean {
  if (!existingPrimary) return false;
  if (existingPrimary.email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) return true;
  throw new AppError('DUPLICATE_RESOURCE', 'Ya existe otra cuenta administradora principal.', 409);
}

export async function bootstrapPrimaryAdmin(input: PrimaryAdminInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!env.adminEmail || email !== env.adminEmail) {
    throw new AppError('FORBIDDEN', 'La cuenta no coincide con ADMIN_EMAIL.', 403);
  }

  const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
  const mongoSession = await mongoose.startSession();
  let userId: string | undefined;

  try {
    await mongoSession.withTransaction(async () => {
      const primaryUsers = await User.find({ isPrimaryAdmin: true }).session(mongoSession).exec();
      if (primaryUsers.some((user) => user.email.trim().toLowerCase() !== email)) {
        throw new AppError(
          'DUPLICATE_RESOURCE',
          'Ya existe otra cuenta administradora principal.',
          409,
        );
      }

      let user = await User.findOne({ email }).session(mongoSession).exec();
      let tenantId: string;
      if (user) {
        tenantId = user.tenantId;
      } else {
        tenantId = generateTenantId();
        const company = new Company({
          tenantId,
          name: 'Apta Digital',
          email,
          status: 'active',
          plan: 'enterprise',
        });
        await company.save({ session: mongoSession });
      }

      await Role.findOneAndUpdate(
        { tenantId, roleId: ROLES.SUPER_ADMIN },
        {
          $set: {
            name: 'Administrador principal',
            description: 'Cuenta propietaria con acceso global al sistema.',
            permissions: copyPrimaryAdminPermissions(),
            scope: 'company',
            isSystem: true,
          },
          $setOnInsert: { tenantId, roleId: ROLES.SUPER_ADMIN },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, session: mongoSession },
      ).exec();

      if (user) {
        user = await User.findByIdAndUpdate(
          user._id,
          {
            $set: {
              email,
              firstName: input.firstName.trim(),
              lastName: input.lastName.trim(),
              passwordHash,
              roleId: ROLES.SUPER_ADMIN,
              isPrimaryAdmin: true,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              status: 'active',
            },
          },
          { new: true, session: mongoSession },
        ).exec();
      } else {
        user = new User({
          tenantId,
          branchId: null,
          email,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          roleId: ROLES.SUPER_ADMIN,
          isPrimaryAdmin: true,
          status: 'active',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        });
        await user.save({ session: mongoSession });
      }

      if (!user)
        throw new AppError('DATABASE_ERROR', 'No se pudo inicializar la cuenta principal.');
      userId = user._id.toString();
      await Token.updateMany(
        { userId },
        { $set: { revoked: true } },
        { session: mongoSession },
      ).exec();
    });
  } finally {
    await mongoSession.endSession();
  }

  if (!userId) {
    throw new AppError('DATABASE_ERROR', 'No se pudo inicializar la cuenta principal.');
  }
}
