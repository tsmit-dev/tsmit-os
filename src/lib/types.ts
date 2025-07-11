export const PERMISSION_KEYS = [
  'dashboard', 'clients', 'os', 
  'adminReports', 'adminUsers', 'adminRoles', 
  'adminServices', 'adminSettings'
] as const;

export type PermissionKey = typeof PERMISSION_KEYS[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  os: 'Ordens de Serviço',
  adminReports: 'Relatórios',
  adminUsers: 'Usuários',
  adminRoles: 'Cargos',
  adminServices: 'Serviços',
  adminSettings: 'Configurações',
};

export interface Permissions extends Record<PermissionKey, boolean> {
dashboard: boolean;
clients: boolean;
os: boolean;
adminReports: boolean;
adminUsers: boolean;
adminRoles: boolean;
adminServices: boolean;
adminSettings: boolean;
}

export interface ProvidedService {
id: string;
name: string;
description?: string;
}

export interface Role {
id: string;
name: string;
permissions: Permissions;
}

export type User = {
id: string;
name: string;
email: string;
roleId: string;
role: Role | null;
};

export type Client = {
id: string;
name: string;
email?: string;
cnpj?: string;
address?: string;
path?: string;
contractedServiceIds?: string[];
webProtection?: boolean;
backup?: boolean;
edr?: boolean;
};

export interface Status {
id: string;
name: string;
order: number;
color: string;
icon?: string;
isInitial?: boolean;
triggersEmail?: boolean;
emailBody?: string;
allowedNextStatuses?: string[];
allowedPreviousStatuses?: string[];
isPickupStatus?: boolean;
isFinal?: boolean;
}


export type LogEntry = {
timestamp: Date;
responsible: string;
fromStatus: string;
toStatus: string;
observation?: string;
};

export type ContractedServices = {
webProtection: boolean;
backup: boolean;
edr: boolean;
};

export type EditLogChange = {
field: string;
oldValue: any;
newValue: any;
};

export type EditLogEntry = {
timestamp: Date;
responsible: string;
changes: EditLogChange[];
observation?: string;
};

export type ServiceOrder = {
id: string;
orderNumber: string;
clientId: string;
collaborator: {
  name: string;
  email?: string;
  phone?: string;
};
equipment: {
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
};
reportedProblem: string;
analyst: string;
status: Status;
technicalSolution?: string;
createdAt: Date;
logs: LogEntry[];
clientName?: string;
attachments?: string[];
contractedServices?: ProvidedService[];
confirmedServiceIds?: string[];
editLogs?: EditLogEntry[];
};

export interface EmailSettings {
smtpServer: string;
smtpPort?: number;
smtpSecurity?: 'none' | 'ssl' | 'tls' | 'ssltls' | 'starttls';
senderEmail?: string;
smtpPassword?: string;
}

export type UpdateServiceOrderResult = {
updatedOrder: ServiceOrder | null;
emailSent?: boolean;
emailErrorMessage?: string;
};
