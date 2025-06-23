"use client"
export type UserRole = 'admin' | 'laboratorio' | 'suporte';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Client = {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
};

export type ServiceOrderStatus =
  | 'aberta'
  | 'em_analise'
  | 'aguardando_peca'
  | 'finalizada'
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
  analyst: string; // The user who created the OS
  status: ServiceOrderStatus;
  technicalSolution?: string;
  createdAt: Date;
  logs: LogEntry[];
  // Joined properties for easier display
  clientName?: string; 
};
