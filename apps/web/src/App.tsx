import React, { useEffect, useMemo, useState } from 'react';
import {
  apiBaseUrl,
  apiErrorCode,
  apiErrorMessage,
  apiRequest,
  readStoredSession,
  saveSession,
  SESSION_EVENT,
  type Session,
  type SessionUser,
} from './api/client';
import {
  createBranchSchema,
  createCompanySchema,
  createUserSchema,
  loginSchema,
  registerSchema,
  updateBranchSchema,
  updateCompanySchema,
  updateUserSchema,
} from '@erp/validation';

interface TextInputProps {
  nativeID?: string;
  className: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: string;
  autoCapitalize?: string;
  autoComplete?: string;
  accessibilityLabel: string;
  placeholder: string;
  required?: boolean;
  secureTextEntry?: boolean;
  minLength?: number;
  maxLength?: number;
}

interface PressableProps {
  className: string;
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityRole?: React.AriaRole;
  accessibilityState?: { selected?: boolean };
  disabled?: boolean;
  type?: 'button' | 'submit';
}

function View({ children, className, role }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} role={role}>{children}</div>;
}

function Text({ children, className, accessibilityRole }: React.HTMLAttributes<HTMLSpanElement> & { accessibilityRole?: React.AriaRole }) {
  const role = accessibilityRole === 'header' ? 'heading' : accessibilityRole;
  const headingLevel = accessibilityRole === 'header' ? 1 : undefined;
  return <span className={className} role={role} aria-level={headingLevel}>{children}</span>;
}

function TextInput({ nativeID, className, value, onChangeText, keyboardType, autoCapitalize, autoComplete, accessibilityLabel, placeholder, required, secureTextEntry, minLength, maxLength }: TextInputProps) {
  const type = secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'text';
  return <input id={nativeID} className={className} type={type} value={value} onChange={(event) => onChangeText(event.currentTarget.value)} autoCapitalize={autoCapitalize} autoComplete={autoComplete} aria-label={accessibilityLabel} placeholder={placeholder} required={required} minLength={minLength} maxLength={maxLength} />;
}

function Pressable({ className, children, onPress, accessibilityRole, accessibilityState, disabled, type = 'button' }: PressableProps) {
  return <button className={className} type={type} onClick={onPress} role={accessibilityRole} aria-pressed={accessibilityState?.selected} disabled={disabled}>{children}</button>;
}

function Image({ source, accessibilityLabel, className }: { source: { uri: string }; accessibilityLabel: string; className: string }) {
  return <img className={className} src={source.uri} alt={accessibilityLabel} />;
}

function ActivityIndicator({ color }: { color: string }) {
  return <span className="loading-spinner" role="status" aria-label="Procesando" style={{ borderTopColor: color }} />;
}

interface ModuleDefinition {
  id: string;
  label: string;
  endpoint: string;
  permission: string;
  columns: Array<{ key: string; label: string }>;
  createFields?: FormField[];
  editFields?: FormField[];
}

interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select';
  required?: boolean;
  maxLength?: number;
  options?: Array<{ label: string; value: string }>;
}

const logoSource = { uri: '/assets/brand/apta-digital-logo.jpg' };
const moduleDefinitions: ModuleDefinition[] = [
  {
    id: 'users', label: 'Usuarios', endpoint: '/users', permission: 'users',
    columns: [
      { key: 'firstName', label: 'Nombre' }, { key: 'lastName', label: 'Apellido' },
      { key: 'email', label: 'Correo' }, { key: 'roleId', label: 'Rol' }, { key: 'status', label: 'Estado' },
    ],
    createFields: [
      { key: 'firstName', label: 'Nombre', maxLength: 100 }, { key: 'lastName', label: 'Apellido', maxLength: 100 },
      { key: 'email', label: 'Correo', type: 'email', maxLength: 254 }, { key: 'password', label: 'Contraseña inicial', type: 'password', maxLength: 128 },
      { key: 'roleId', label: 'Identificador de rol', maxLength: 100 }, { key: 'branchId', label: 'ID de sucursal', required: false },
    ],
    editFields: [
      { key: 'firstName', label: 'Nombre', maxLength: 100 }, { key: 'lastName', label: 'Apellido', maxLength: 100 },
      { key: 'roleId', label: 'Identificador de rol', maxLength: 100 },
      { key: 'branchId', label: 'ID de sucursal', required: false },
      { key: 'status', label: 'Estado', type: 'select', options: [{ label: 'Activo', value: 'active' }, { label: 'Inactivo', value: 'inactive' }, { label: 'Bloqueado', value: 'locked' }] },
    ],
  },
  {
    id: 'companies', label: 'Empresas', endpoint: '/companies', permission: 'companies',
    columns: [
      { key: 'name', label: 'Empresa' }, { key: 'ruc', label: 'RUC' },
      { key: 'email', label: 'Correo' }, { key: 'status', label: 'Estado' },
    ],
    createFields: [
      { key: 'name', label: 'Nombre', maxLength: 200 }, { key: 'ruc', label: 'RUC', maxLength: 20 },
      { key: 'email', label: 'Correo', type: 'email', maxLength: 254 },
    ],
    editFields: [
      { key: 'name', label: 'Nombre', required: false, maxLength: 200 }, { key: 'ruc', label: 'RUC', required: false, maxLength: 20 },
      { key: 'email', label: 'Correo', type: 'email', required: false, maxLength: 254 },
    ],
  },
  {
    id: 'branches', label: 'Sucursales', endpoint: '/branches', permission: 'branches',
    columns: [
      { key: 'name', label: 'Sucursal' }, { key: 'address.city', label: 'Ciudad' },
      { key: 'phone', label: 'Teléfono' }, { key: 'status', label: 'Estado' },
    ],
    createFields: [
      { key: 'branchId', label: 'ID de sucursal (UUID)' }, { key: 'name', label: 'Nombre', maxLength: 200 },
      { key: 'address.street', label: 'Calle' }, { key: 'address.city', label: 'Ciudad' },
      { key: 'address.state', label: 'Provincia/Estado' }, { key: 'address.country', label: 'País' },
      { key: 'address.zipCode', label: 'Código postal' }, { key: 'phone', label: 'Teléfono', maxLength: 20 },
    ],
    editFields: [
      { key: 'name', label: 'Nombre', required: false, maxLength: 200 },
      { key: 'address.street', label: 'Calle', required: false }, { key: 'address.city', label: 'Ciudad', required: false },
      { key: 'address.state', label: 'Provincia/Estado', required: false }, { key: 'address.country', label: 'País', required: false },
      { key: 'address.zipCode', label: 'Código postal', required: false }, { key: 'phone', label: 'Teléfono', required: false, maxLength: 20 },
      { key: 'status', label: 'Estado', type: 'select', options: [{ label: 'Activo', value: 'active' }, { label: 'Inactivo', value: 'inactive' }] },
    ],
  },
  {
    id: 'roles', label: 'Roles', endpoint: '/roles', permission: 'roles',
    columns: [
      { key: 'roleId', label: 'Identificador' }, { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' }, { key: 'isSystem', label: 'Sistema' },
    ],
    createFields: [
      { key: 'roleId', label: 'Identificador', maxLength: 100 }, { key: 'name', label: 'Nombre', maxLength: 100 },
      { key: 'description', label: 'Descripción', type: 'textarea', required: false, maxLength: 500 },
      { key: 'scope', label: 'Alcance', type: 'select', options: [{ label: 'Empresa', value: 'company' }, { label: 'Sucursal', value: 'branch' }] },
      { key: 'permissions', label: 'Permisos (JSON)', type: 'textarea' },
    ],
    editFields: [
      { key: 'name', label: 'Nombre', maxLength: 100 }, { key: 'description', label: 'Descripción', type: 'textarea', required: false, maxLength: 500 },
      { key: 'scope', label: 'Alcance', type: 'select', options: [{ label: 'Empresa', value: 'company' }, { label: 'Sucursal', value: 'branch' }] },
      { key: 'permissions', label: 'Permisos (JSON)', type: 'textarea' },
    ],
  },
  {
    id: 'audit', label: 'Auditoría', endpoint: '/audit', permission: 'audit',
    columns: [
      { key: 'action', label: 'Acción' }, { key: 'module', label: 'Módulo' },
      { key: 'userName', label: 'Usuario' }, { key: 'timestamp', label: 'Fecha' },
    ],
  },
  {
    id: 'settings', label: 'Configuración', endpoint: '/settings', permission: 'settings',
    columns: [
      { key: 'key', label: 'Clave' }, { key: 'type', label: 'Tipo' },
      { key: 'description', label: 'Descripción' }, { key: 'value', label: 'Valor' },
    ],
    createFields: [
      { key: 'key', label: 'Clave', maxLength: 100 }, { key: 'value', label: 'Valor', type: 'textarea' },
      { key: 'type', label: 'Tipo', type: 'select', options: [{ label: 'Texto', value: 'string' }, { label: 'Número', value: 'number' }, { label: 'Booleano', value: 'boolean' }, { label: 'JSON', value: 'json' }] },
      { key: 'description', label: 'Descripción', required: false, maxLength: 500 },
    ],
    editFields: [
      { key: 'value', label: 'Valor', type: 'textarea' },
      { key: 'type', label: 'Tipo', type: 'select', options: [{ label: 'Texto', value: 'string' }, { label: 'Número', value: 'number' }, { label: 'Booleano', value: 'boolean' }, { label: 'JSON', value: 'json' }] },
      { key: 'description', label: 'Descripción', required: false, maxLength: 500 },
    ],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasPermission(user: SessionUser, module: string, action = 'read'): boolean {
  return user.permissions?.some((permission) =>
    permission.module === module && permission.actions[action] === true,
  ) ?? false;
}

function canCreate(user: SessionUser, module: ModuleDefinition): boolean {
  return hasPermission(user, module.permission, module.id === 'settings' ? 'update' : 'create');
}

function canUpdate(user: SessionUser, module: ModuleDefinition): boolean {
  return hasPermission(user, module.permission, 'update');
}

function unwrapRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return [];
  for (const key of ['items', 'results', 'docs', 'data']) {
    const candidate = data[key];
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  return [];
}

function getField(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, record);
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formFields(module: ModuleDefinition, mode: 'create' | 'edit'): FormField[] {
  return mode === 'create' ? module.createFields ?? [] : module.editFields ?? [];
}

function assignPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!isRecord(current[part])) current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function initialFormValues(module: ModuleDefinition, mode: 'create' | 'edit', row?: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of formFields(module, mode)) {
    const value = row ? getField(row, field.key) : undefined;
    values[field.key] = field.key === 'permissions' && Array.isArray(value)
      ? JSON.stringify(value, null, 2)
      : value === undefined || value === null ? '' : String(value);
  }
  if (module.id === 'branches' && mode === 'create') values.branchId = crypto.randomUUID();
  if (module.id === 'roles' && mode === 'create') {
    values.permissions = '[]';
    values.scope = 'company';
  }
  if (module.id === 'settings' && mode === 'create') values.type = 'string';
  return values;
}

function formPayload(module: ModuleDefinition, mode: 'create' | 'edit', values: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of formFields(module, mode)) {
    const value = values[field.key] ?? '';
    if (field.required === false && !value) continue;
    assignPath(payload, field.key, value);
  }

  if (module.id === 'roles' && typeof payload.permissions === 'string') {
    payload.permissions = JSON.parse(payload.permissions);
  }
  if (module.id === 'settings') {
    const type = String(payload.type ?? 'string');
    const rawValue = String(payload.value ?? '');
    if (type === 'number') payload.value = Number(rawValue);
    else if (type === 'boolean') payload.value = rawValue === 'true';
    else if (type === 'json') payload.value = JSON.parse(rawValue);
    else payload.value = rawValue;
  }
  if (module.id === 'users' && payload.branchId === '') delete payload.branchId;
  return payload;
}

function validatePayload(module: ModuleDefinition, mode: 'create' | 'edit', payload: Record<string, unknown>): string | null {
  const result = module.id === 'users'
    ? (mode === 'create' ? createUserSchema : updateUserSchema).safeParse(payload)
    : module.id === 'companies'
      ? (mode === 'create' ? createCompanySchema : updateCompanySchema).safeParse(payload)
      : module.id === 'branches'
        ? (mode === 'create' ? createBranchSchema : updateBranchSchema).safeParse(payload)
        : null;

  if (result && !result.success) {
    return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' ');
  }

  if (module.id === 'roles') {
    if (mode === 'create' && !String(payload.roleId ?? '').trim()) return 'El identificador del rol es obligatorio.';
    if (!String(payload.name ?? '').trim()) return 'El nombre del rol es obligatorio.';
    if (!Array.isArray(payload.permissions) || !payload.permissions.every((permission) =>
      isRecord(permission) && typeof permission.module === 'string' && isRecord(permission.actions) &&
      Object.values(permission.actions).every((action) => typeof action === 'boolean'),
    )) return 'Los permisos deben ser un arreglo JSON de módulos y acciones booleanas.';
  }

  if (module.id === 'settings') {
    if (mode === 'create' && !String(payload.key ?? '').trim()) return 'La clave es obligatoria.';
    if (payload.value === undefined) return 'El valor es obligatorio.';
    if (!['string', 'number', 'boolean', 'json'].includes(String(payload.type))) return 'Selecciona un tipo válido.';
    if (payload.type === 'number' && !Number.isFinite(payload.value)) return 'El valor debe ser un número válido.';
  }

  return null;
}

function App() {
  const [session, setSession] = useState<Session | null>(readStoredSession);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [isVerificationRoute, setIsVerificationRoute] = useState(
    () => new URLSearchParams(window.location.search).get('verify-email') === '1',
  );
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [verificationError, setVerificationError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [sessionMessage, setSessionMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [formState, setFormState] = useState<{ module: ModuleDefinition; mode: 'create' | 'edit'; row?: Record<string, unknown> } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const syncSession = (): void => setSession(readStoredSession());
    window.addEventListener(SESSION_EVENT, syncSession);
    return () => window.removeEventListener(SESSION_EVENT, syncSession);
  }, []);

  useEffect(() => {
    if (!isVerificationRoute) return;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setVerificationState('error');
      setVerificationError('El enlace de verificación no contiene un token válido.');
      return;
    }

    let isCurrent = true;
    setVerificationState('loading');
    apiRequest('POST', '/auth/verify-email', { token }, null).then(() => {
      if (isCurrent) setVerificationState('success');
    }).catch((error: unknown) => {
      if (!isCurrent) return;
      setVerificationState('error');
      setVerificationError(apiErrorMessage(error));
    });

    return () => { isCurrent = false; };
  }, [isVerificationRoute]);

  const visibleModules = useMemo(
    () => session ? moduleDefinitions.filter((module) => hasPermission(session.user, module.permission)) : [],
    [session],
  );
  const selectedModule = moduleDefinitions.find((module) => module.id === activeModule);

  useEffect(() => {
    if (!session || !selectedModule || !hasPermission(session.user, selectedModule.permission)) {
      setRows([]);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setLoadError('');
    setSearch('');
    const listEndpoint = selectedModule.id === 'audit'
      ? `${selectedModule.endpoint}?page=1&limit=20`
      : selectedModule.endpoint;
    apiRequest<unknown>('GET', listEndpoint, undefined, session).then((data) => {
      if (isCurrent) setRows(unwrapRows(data));
    }).catch((error: unknown) => {
      if (!isCurrent) return;
      if (!readStoredSession()) {
        setSessionMessage('La sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      setLoadError(apiErrorMessage(error));
    }).finally(() => {
      if (isCurrent) setIsLoading(false);
    });

    return () => { isCurrent = false; };
  }, [activeModule, reloadKey, selectedModule, session]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const validation = loginSchema.safeParse({ email: email.trim(), password });
      if (!validation.success) throw new Error(validation.error.issues.map((issue) => issue.message).join(' '));
      const nextSession = await apiRequest<Session>('POST', '/auth/login', validation.data, null);
      saveSession(nextSession);
      setActiveModule('dashboard');
      setPassword('');
      setSessionMessage('');
      setRequiresEmailVerification(false);
      setResendMessage('');
    } catch (error: unknown) {
      setLoginError(apiErrorMessage(error));
      setRequiresEmailVerification(apiErrorCode(error) === 'EMAIL_NOT_VERIFIED');
      setResendMessage('');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }

    setIsRegistering(true);
    setRegisterError('');
    try {
      const validation = registerSchema.safeParse({
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, companyName: companyName.trim(),
      });
      if (!validation.success) throw new Error(validation.error.issues.map((issue) => issue.message).join(' '));
      await apiRequest<{ message: string }>('POST', '/auth/register', validation.data, null);
      setRegistrationPending(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      setRegisterError(apiErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleResendVerification(): Promise<void> {
    setIsResendingVerification(true);
    setResendMessage('');
    try {
      const result = await apiRequest<{ message: string }>(
        'POST',
        '/auth/resend-verification',
        { email: email.trim() },
        null,
      );
      setResendMessage(result.message);
    } catch (error: unknown) {
      setResendMessage(apiErrorMessage(error));
    } finally {
      setIsResendingVerification(false);
    }
  }

  function returnToLogin(): void {
    window.history.replaceState({}, '', '/');
    setIsVerificationRoute(false);
    setAuthMode('login');
    setRegistrationPending(false);
    setLoginError('');
  }

  async function handleLogout() {
    if (session?.refreshToken) {
      try {
        await apiRequest('POST', '/auth/logout', { refreshToken: session.refreshToken }, session);
      } catch {
        // Local session is still cleared if the API is unavailable.
      }
    }
    saveSession(null);
    setActiveModule('dashboard');
    setRows([]);
  }

  function openForm(module: ModuleDefinition, mode: 'create' | 'edit', row?: Record<string, unknown>): void {
    setFormState({ module, mode, row });
    setFormValues(initialFormValues(module, mode, row));
    setFormError('');
    setNotice('');
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!formState || !session) return;

    setIsSaving(true);
    setFormError('');
    try {
      const payload = formPayload(formState.module, formState.mode, formValues);
      const validationError = validatePayload(formState.module, formState.mode, payload);
      if (validationError) throw new Error(validationError);

      if (formState.module.id === 'settings') {
        const key = formState.mode === 'create' ? String(payload.key) : String(formState.row?.key);
        const { key: _key, ...settingData } = payload;
        await apiRequest('PUT', `/settings/${encodeURIComponent(key)}`, settingData, session);
      } else if (formState.mode === 'create') {
        await apiRequest('POST', formState.module.endpoint, payload, session);
      } else {
        const id = String(formState.row?._id ?? formState.row?.id ?? '');
        if (!id) throw new Error('El registro no contiene un identificador válido.');
        await apiRequest('PUT', `${formState.module.endpoint}/${encodeURIComponent(id)}`, payload, session);
      }

      setFormState(null);
      setNotice(formState.mode === 'create' ? 'Registro creado.' : 'Cambios guardados.');
      setReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setFormError(apiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(module: ModuleDefinition, row: Record<string, unknown>): Promise<void> {
    if (!session || !hasPermission(session.user, module.permission, 'delete')) return;
    if (module.id === 'roles' && row.isSystem === true) {
      setLoadError('La API protege los roles del sistema y no permite eliminarlos.');
      return;
    }

    const recordKey = module.id === 'settings'
      ? String(row.key ?? '')
      : String(row._id ?? row.id ?? '');
    if (!recordKey) {
      setLoadError('El registro no contiene un identificador válido.');
      return;
    }
    if (!window.confirm(`¿Eliminar ${module.label.toLocaleLowerCase()} "${recordKey}"? Esta acción no se puede deshacer.`)) return;

    setLoadError('');
    setNotice('');
    try {
      await apiRequest('DELETE', `${module.endpoint}/${encodeURIComponent(recordKey)}`, undefined, session);
      setNotice('Registro eliminado.');
      setReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setLoadError(apiErrorMessage(error));
    }
  }

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) => formatCell(value).toLocaleLowerCase().includes(search.toLocaleLowerCase())),
  );

  if (isVerificationRoute) {
    return (
      <View className="login-page">
        <View className="login-brand-panel">
          <Image className="login-logo" source={logoSource} accessibilityLabel="Logo de Apta Digital" />
          <Text className="login-brand-caption">GESTIÓN EMPRESARIAL</Text>
          <View className="brand-rule" />
          <Text className="brand-statement">Un último paso para activar tu cuenta.</Text>
          <Text className="brand-footnote">Verifica tu correo para acceder a tu organización.</Text>
        </View>
        <View className="login-form-panel">
          <View className="login-form-wrap">
            <Text className="eyebrow">VERIFICACIÓN DE CORREO</Text>
            <Text accessibilityRole="header" className="login-title">
              {verificationState === 'success' ? 'Correo verificado' : verificationState === 'loading' ? 'Verificando correo…' : 'No se pudo verificar'}
            </Text>
            {verificationState === 'loading' ? (
              <View className="verification-status"><ActivityIndicator color="#0090a0" /><Text className="login-description">Estamos comprobando tu enlace.</Text></View>
            ) : null}
            {verificationState === 'success' ? <Text className="form-notice" role="status">Correo verificado correctamente. Ya puedes iniciar sesión.</Text> : null}
            {verificationState === 'error' ? <Text className="form-error" role="alert">{verificationError}</Text> : null}
            {verificationState !== 'loading' ? (
              <Pressable className="primary-button" onPress={returnToLogin} accessibilityRole="button">
                <Text className="primary-button-text">{session ? 'Continuar' : 'Ir al inicio de sesión'}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="login-page">
        <View className="login-brand-panel">
          <Image className="login-logo" source={logoSource} accessibilityLabel="Logo de Apta Digital" />
          <Text className="login-brand-caption">GESTIÓN EMPRESARIAL</Text>
          <View className="brand-rule" />
          <Text className="brand-statement">Administración clara para operaciones complejas.</Text>
          <Text className="brand-footnote">Acceso seguro a los módulos de tu organización.</Text>
        </View>
        <View className="login-form-panel">
          <View className="login-form-wrap">
            <Text className="eyebrow">PORTAL EMPRESARIAL</Text>
            <Text accessibilityRole="header" className="login-title">{authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
            <Text className="login-description">{authMode === 'login' ? 'Ingresa con las credenciales de tu cuenta.' : 'Registra tu empresa y crea su cuenta administradora.'}</Text>
            {sessionMessage ? <Text className="form-notice" accessibilityRole="alert">{sessionMessage}</Text> : null}
            {registrationPending ? (
              <View className="verification-pending">
                <Text className="form-notice" role="status">Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.</Text>
                <Pressable className="secondary-button" onPress={() => { setRegistrationPending(false); setAuthMode('login'); }} accessibilityRole="button">
                  <Text className="secondary-button-text">Volver al inicio de sesión</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View className="auth-mode-switch" role="group">
                  <Pressable className={`auth-mode-button${authMode === 'login' ? ' selected' : ''}`} onPress={() => { setAuthMode('login'); setRegisterError(''); setRegistrationPending(false); }} accessibilityRole="button" accessibilityState={{ selected: authMode === 'login' }}><Text className="auth-mode-text">Iniciar sesión</Text></Pressable>
                  <Pressable className={`auth-mode-button${authMode === 'register' ? ' selected' : ''}`} onPress={() => { setAuthMode('register'); setLoginError(''); setRequiresEmailVerification(false); }} accessibilityRole="button" accessibilityState={{ selected: authMode === 'register' }}><Text className="auth-mode-text">Crear cuenta</Text></Pressable>
                </View>
                <form className="login-form" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' ? (
                <>
                  <View className="field-grid">
                    <View className="field-group"><label className="field-label" htmlFor="register-first-name">Nombre</label><TextInput nativeID="register-first-name" className="text-field" value={firstName} onChangeText={setFirstName} accessibilityLabel="Nombre" placeholder="Nombre" maxLength={100} required /></View>
                    <View className="field-group"><label className="field-label" htmlFor="register-last-name">Apellido</label><TextInput nativeID="register-last-name" className="text-field" value={lastName} onChangeText={setLastName} accessibilityLabel="Apellido" placeholder="Apellido" maxLength={100} required /></View>
                  </View>
                  <View className="field-group"><label className="field-label" htmlFor="register-company">Nombre de empresa</label><TextInput nativeID="register-company" className="text-field" value={companyName} onChangeText={setCompanyName} accessibilityLabel="Nombre de empresa" placeholder="Empresa" maxLength={200} required /></View>
                </>
              ) : null}
              <View className="field-group"><label className="field-label" htmlFor="login-email">Correo electrónico</label><TextInput nativeID="login-email" className="text-field" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Correo electrónico" placeholder="nombre@empresa.com" maxLength={254} required /></View>
              <View className="field-group"><label className="field-label" htmlFor="login-password">Contraseña</label><TextInput nativeID="login-password" className="text-field" value={password} onChangeText={setPassword} secureTextEntry autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} accessibilityLabel="Contraseña" placeholder="Contraseña" minLength={authMode === 'register' ? 8 : 1} maxLength={128} required /></View>
              {authMode === 'register' ? <View className="field-group"><label className="field-label" htmlFor="register-confirm-password">Confirmar contraseña</label><TextInput nativeID="register-confirm-password" className="text-field" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" accessibilityLabel="Confirmar contraseña" placeholder="Repite la contraseña" minLength={8} maxLength={128} required /></View> : null}
              {authMode === 'login' && loginError ? <Text className="form-error" accessibilityRole="alert">{loginError}</Text> : null}
              {authMode === 'login' && requiresEmailVerification ? (
                <View className="verification-resend">
                  <Pressable className="secondary-button" onPress={handleResendVerification} disabled={isResendingVerification} accessibilityRole="button">
                    <Text className="secondary-button-text">{isResendingVerification ? 'Enviando…' : 'Reenviar correo de verificación'}</Text>
                  </Pressable>
                  {resendMessage ? <Text className="form-notice" role="status">{resendMessage}</Text> : null}
                </View>
              ) : null}
              {authMode === 'register' && registerError ? <Text className="form-error" accessibilityRole="alert">{registerError}</Text> : null}
              <Pressable className="primary-button" accessibilityRole="button" disabled={isLoggingIn || isRegistering} type="submit">
                {isLoggingIn || isRegistering ? <ActivityIndicator color="#ffffff" /> : <Text className="primary-button-text">{authMode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>}
              </Pressable>
                </form>
              </>
            )}
            <Text className="api-caption">API: {apiBaseUrl || 'URL no configurada'}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="app-frame">
      <View className="sidebar">
        <View className="brand-lockup">
          <Image className="sidebar-logo" source={logoSource} accessibilityLabel="Logo de Apta Digital" />
          <View className="brand-name"><Text className="brand-name-title">Apta Digital</Text><Text className="brand-name-subtitle">GESTIÓN EMPRESARIAL</Text></View>
        </View>
        <View className="nav-section">
          <Text className="sidebar-label">GENERAL</Text>
          <Pressable className={`nav-item${activeModule === 'dashboard' ? ' active' : ''}`} onPress={() => setActiveModule('dashboard')} accessibilityRole="button" accessibilityState={{ selected: activeModule === 'dashboard' }}>
            <Text className="nav-item-text">Panel de control</Text>
          </Pressable>
        </View>
        <View className="nav-section">
          <Text className="sidebar-label">ADMINISTRACIÓN</Text>
          {visibleModules.filter((module) => ['users', 'companies', 'branches', 'roles'].includes(module.id)).map((module) => (
            <Pressable key={module.id} className={`nav-item${activeModule === module.id ? ' active' : ''}`} onPress={() => setActiveModule(module.id)} accessibilityRole="button" accessibilityState={{ selected: activeModule === module.id }}>
              <Text className="nav-item-text">{module.label}</Text>
              <Text className="nav-access">API</Text>
            </Pressable>
          ))}
        </View>
        <View className="nav-section">
          <Text className="sidebar-label">CONTROL</Text>
          {visibleModules.filter((module) => ['audit', 'settings'].includes(module.id)).map((module) => (
            <Pressable key={module.id} className={`nav-item${activeModule === module.id ? ' active' : ''}`} onPress={() => setActiveModule(module.id)} accessibilityRole="button" accessibilityState={{ selected: activeModule === module.id }}>
              <Text className="nav-item-text">{module.label}</Text>
              <Text className="nav-access">API</Text>
            </Pressable>
          ))}
        </View>
        <View className="sidebar-foot"><Text className="sidebar-foot-name">{session.user.firstName} {session.user.lastName}</Text><Text className="sidebar-foot-role">{session.user.roleId}</Text></View>
      </View>

      <View className="workspace">
        <View className="topbar">
          <Text className="breadcrumb">Apta Digital <Text className="breadcrumb-separator">/</Text> {selectedModule?.label ?? 'Panel'}</Text>
          <View className="account-actions"><Text className="account-email">{session.user.email}</Text><Pressable className="logout-button" onPress={handleLogout} accessibilityRole="button"><Text className="logout-button-text">Cerrar sesión</Text></Pressable></View>
        </View>

        <View className="workspace-main">
          {activeModule === 'dashboard' ? (
            <>
              <View className="page-heading">
                <View><Text className="eyebrow">GENERAL / RESUMEN</Text><Text accessibilityRole="header" className="page-title">Panel de control</Text><Text className="page-description">Acceso a los módulos habilitados para tu cuenta.</Text></View>
                <View className="live-badge"><View className="live-dot" /><Text className="live-badge-text">Sesión activa</Text></View>
              </View>
              <View className="data-note"><Text className="data-note-title">Sin indicadores de negocio</Text><Text className="data-note-copy">La API no publica un endpoint de dashboard. Los datos se cargan desde cada módulo al seleccionarlo.</Text></View>
              <View className="dashboard-summary">
                <View className="summary-card"><Text className="summary-label">Módulos habilitados</Text><Text className="summary-value">{visibleModules.length}</Text><Text className="summary-foot">Según los permisos de tu sesión</Text></View>
                <View className="summary-card"><Text className="summary-label">Rol actual</Text><Text className="summary-value summary-role">{session.user.roleId || '—'}</Text><Text className="summary-foot">Asignado a tu usuario</Text></View>
                <View className="summary-card"><Text className="summary-label">Organización</Text><Text className="summary-value summary-role">{session.user.tenantId ? 'Activa' : '—'}</Text><Text className="summary-foot">Contexto de sesión</Text></View>
              </View>
              <View className="content-panel">
                <View className="panel-heading"><Text className="panel-title">Tus módulos</Text><Text className="panel-meta">Acceso de lectura disponible</Text></View>
                {visibleModules.length ? visibleModules.map((module) => (
                  <Pressable key={module.id} className="module-link" onPress={() => setActiveModule(module.id)} accessibilityRole="button">
                    <View><Text className="module-link-title">{module.label}</Text><Text className="module-link-path">{module.endpoint}</Text></View>
                    <Text className="module-link-action">Abrir</Text>
                  </Pressable>
                )) : <Text className="empty-message">Tu sesión no incluye permisos de lectura para los módulos registrados.</Text>}
              </View>
            </>
          ) : selectedModule ? (
            <>
              <View className="page-heading module-heading">
                <View><Text className="eyebrow">ADMINISTRACIÓN / {selectedModule.label.toLocaleUpperCase()}</Text><Text accessibilityRole="header" className="page-title">{selectedModule.label}</Text><Text className="page-description">Registros disponibles para tu organización.</Text></View>
                <View className="module-actions">
                  {selectedModule.createFields && canCreate(session.user, selectedModule) ? (
                    <Pressable className="primary-button compact-button" onPress={() => openForm(selectedModule, 'create')} accessibilityRole="button">
                      <Text className="primary-button-text">{selectedModule.id === 'settings' ? 'Nueva configuración' : 'Crear'}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable className="secondary-button" onPress={() => setReloadKey((current) => current + 1)} accessibilityRole="button"><Text className="secondary-button-text">Actualizar</Text></Pressable>
                </View>
              </View>
              {notice ? <View className="integration-notice" role="status"><Text>{notice}</Text></View> : null}
              <View className="list-toolbar">
                <TextInput className="search-field" value={search} onChangeText={setSearch} accessibilityLabel={`Buscar en ${selectedModule.label}`} placeholder="Buscar registros" />
                <Text className="record-count">{filteredRows.length} registros</Text>
              </View>
              <View className="content-panel table-panel">
                {isLoading ? <View className="loading-state"><ActivityIndicator color="#0090a0" /><Text className="loading-copy">Cargando {selectedModule.label.toLocaleLowerCase()}…</Text></View> : null}
                {loadError ? <View className="error-state"><Text className="error-title">No se pudo cargar el módulo</Text><Text className="error-copy">{loadError}</Text></View> : null}
                {!isLoading && !loadError && filteredRows.length === 0 ? <View className="empty-state"><Text className="empty-title">{rows.length ? 'Sin coincidencias' : 'Sin registros'}</Text><Text className="empty-copy">{rows.length ? 'Prueba con otro término de búsqueda.' : 'No hay datos disponibles para mostrar.'}</Text></View> : null}
                {!isLoading && !loadError && filteredRows.length > 0 ? (
                  <View className="table-scroll"><table className="data-table">
                    <thead><tr>{selectedModule.columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
                      {canUpdate(session.user, selectedModule) || hasPermission(session.user, selectedModule.permission, 'delete') ? <th scope="col">Acciones</th> : null}
                    </tr></thead>
                    <tbody>{filteredRows.map((row, rowIndex) => <tr key={String(row._id ?? row.id ?? rowIndex)}>{selectedModule.columns.map((column) => {
                      const value = getField(row, column.key);
                      const isStatus = column.key === 'status';
                      return <td key={column.key}>{isStatus ? <span className={`status-badge status-${String(value ?? 'unknown')}`}>{formatCell(value)}</span> : formatCell(value)}</td>;
                    })}
                      {canUpdate(session.user, selectedModule) || hasPermission(session.user, selectedModule.permission, 'delete') ? (
                        <td className="row-actions">
                          {selectedModule.editFields && canUpdate(session.user, selectedModule) ? <button className="table-action" type="button" onClick={() => openForm(selectedModule, 'edit', row)}>Editar</button> : null}
                          {hasPermission(session.user, selectedModule.permission, 'delete') && !(selectedModule.id === 'roles' && row.isSystem === true) ? <button className="table-action danger-action" type="button" onClick={() => void handleDelete(selectedModule, row)}>Eliminar</button> : null}
                        </td>
                      ) : null}
                    </tr>)}</tbody>
                  </table></View>
                ) : null}
              </View>
            </>
          ) : null}
        </View>
        {formState ? (
          <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormState(null); }}>
            <section className="record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
              <header className="dialog-heading">
                <div><span className="eyebrow">{formState.module.label.toLocaleUpperCase()}</span><h2 id="record-dialog-title">{formState.mode === 'create' ? 'Crear registro' : 'Editar registro'}</h2></div>
                <button className="dialog-close" type="button" aria-label="Cerrar" onClick={() => setFormState(null)}>×</button>
              </header>
              <form className="record-form" onSubmit={handleFormSubmit}>
                {formFields(formState.module, formState.mode).map((field) => {
                  const inputId = `record-${field.key.replaceAll('.', '-')}`;
                  const common = {
                    id: inputId,
                    name: field.key,
                    value: formValues[field.key] ?? '',
                    required: field.required !== false,
                    maxLength: field.maxLength,
                    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.currentTarget.value })),
                  };
                  return (
                    <div className="field-group" key={field.key}>
                      <label className="field-label" htmlFor={inputId}>{field.label}</label>
                      {field.type === 'textarea' ? <textarea {...common} className="record-textarea" rows={field.key === 'permissions' ? 8 : 3} /> : null}
                      {field.type === 'select' ? (
                        <select {...common} className="record-select">
                          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      ) : null}
                      {field.type !== 'textarea' && field.type !== 'select' ? (
                        <input {...common} className="text-field" type={field.type ?? 'text'} minLength={field.type === 'password' ? 8 : undefined} autoComplete={field.type === 'password' ? 'new-password' : undefined} />
                      ) : null}
                    </div>
                  );
                })}
                {formError ? <p className="form-error" role="alert">{formError}</p> : null}
                <div className="dialog-actions">
                  <button className="secondary-button" type="button" onClick={() => setFormState(null)}>Cancelar</button>
                  <button className="primary-button compact-button" type="submit" disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color="#ffffff" /> : <span className="primary-button-text">Guardar</span>}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </View>
    </View>
  );
}

export default App;