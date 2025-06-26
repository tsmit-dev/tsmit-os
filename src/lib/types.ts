export interface Permissions {
  dashboard: boolean;
  clients: boolean;
  os: boolean;
  adminReports: boolean;
  adminUsers: boolean;
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
  role?: Role;
};

export type Client = {
  id: string;
  name: string;
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
  reportedProblem: string;
  analyst: string;
  status: ServiceOrderStatus;
  technicalSolution?: string;
  createdAt: Date;
  logs: LogEntry[];
  clientName?: string; 
};

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: 'none' | 'ssl' | 'tls' | 'starttls'; // Simplified for common options
  senderEmail: string;
  senderPassword?: string; // Should be handled securely on backend
}
