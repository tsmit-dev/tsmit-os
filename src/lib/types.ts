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
};

export type ServiceOrderStatus =
  | 'aberta'
  | 'em_analise'
  | 'aguardando_peca'
  | 'pronta_entrega'
  | 'entregue';

export type LogEntry = {
  timestamp: Date;
  responsible: string;
  fromStatus: ServiceOrderStatus;
  toStatus: ServiceOrderStatus;
  observation?: string;
};

export type ServiceOrder = {
  id: string;
  orderNumber: string;
  clientId: string;
  collaborator: {
    name: string;
    email: string;
    phone: string;
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
