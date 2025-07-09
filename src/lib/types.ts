export interface Permissions {
  dashboard: boolean;
  clients: boolean;
  os: boolean;
  adminReports: boolean;
  adminUsers: boolean;
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
  contractedServiceIds?: string[]; // Array de IDs dos serviços contratados
  // Os campos abaixo serão substituídos gradualmente
  webProtection?: boolean;
  backup?: boolean;
  edr?: boolean;
};

export interface Status {
  id: string;
  name: string;
  order: number;
  color: string; // Added color field
  isInitial?: boolean;
  triggersEmail?: boolean;
  allowedNextStatuses?: string[];
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
  status: string;
  technicalSolution?: string;
  createdAt: Date;
  logs: LogEntry[];
  clientName?: string;
  attachments?: string[];
  contractedServices?: ProvidedService[]; // Armazena os objetos de serviço no momento da criação da OS
  confirmedServiceIds?: string[]; // Armazena os IDs dos serviços confirmados pelo técnico
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
