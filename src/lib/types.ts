export interface Permissions {
  dashboard: boolean;
  clients: boolean;
  os: boolean;
  adminReports: boolean;
  adminUsers: boolean;
  adminRoles: boolean; // Added this line
  adminSettings: boolean;
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
  role: Role | null; // Changed to explicitly allow null
};

export type Client = {
  id: string;
  name: string;
  email?: string; // Added email to Client interface
  cnpj?: string;
  address?: string;
  path?: string;
  webProtection?: boolean;
  backup?: boolean;
  edr?: boolean;
};

export type ServiceOrderStatus =
  | 'aberta'
  | 'em_analise'
  | 'aguardando_peca'
  | 'aguardando_terceiros'
  | 'pronta_entrega'
  | 'entregue';

export type LogEntry = {
  timestamp: Date;
  responsible: string;
  fromStatus: ServiceOrderStatus;
  toStatus: ServiceOrderStatus;
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
  observation?: string; // Optional field for a general observation about the edit
};

export type ServiceOrder = {
  id: string;
  orderNumber: string;
  clientId: string;
  collaborator: {
    name: string;
    email?: string; // Made email optional
    phone?: string; // Made phone optional
  };
  equipment: {
    type: string;
    brand: string;
    model: string;
    serialNumber: string;
  };
  reportedProblem: string; // Changed from problemDescription
  analyst: string;
  status: ServiceOrderStatus;
  technicalSolution?: string;
  createdAt: Date;
  logs: LogEntry[];
  clientName?: string; 
  attachments?: string[];
  contractedServices?: ContractedServices; // New field for services contracted by the client for this OS
  confirmedServices?: ContractedServices; // New field for services confirmed by the analyst for this OS
  editLogs?: EditLogEntry[]; // New field for detailed edit history
};

export interface EmailSettings {
  smtpServer: string;
  smtpPort?: number;
  smtpSecurity?: 'none' | 'ssl' | 'tls' | 'ssltls' | 'starttls'; // Simplified for common options
  senderEmail?: string;
  smtpPassword?: string; // Should be handled securely on backend
}

export type UpdateServiceOrderResult = {
  updatedOrder: ServiceOrder | null;
  emailSent?: boolean;
  emailErrorMessage?: string;
};