"use client"
import { ServiceOrder, ServiceOrderStatus, User, UserRole, Client } from "./types";

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- USERS ---
let users: (User & {password: string})[] = [
    { id: 'user-1', name: 'Admin TSMIT', email: 'admin@tsmit.com.br', role: 'admin', password: 'asd' },
    { id: 'user-2', name: 'Suporte TSMIT', email: 'suporte@tsmit.com.br', role: 'suporte', password: 'asd' },
    { id: 'user-3', name: 'Laboratório TSMIT', email: 'laboratorio@tsmit.com.br', role: 'laboratorio', password: 'asd' },
    { id: 'user-4', name: 'João Victor', email: 'joaovictor@tsmit.com.br', role: 'admin', password: 'asd.123' },
];

export const getUserByCredentials = async (email: string, password?: string): Promise<User | null> => {
    await delay(200);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    return null;
};

export const getUsers = async (): Promise<User[]> => {
    await delay(200);
    return users.map(u => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
};

export const getUserById = async (id: string): Promise<User | null> => {
    await delay(200);
    const user = users.find(u => u.id === id);
    if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}

export type UserData = {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
};

export const addUser = async (data: UserData): Promise<User> => {
    await delay(300);
    const newUser = {
        ...data,
        id: `user-${Date.now()}`,
        password: data.password || 'default-password'
    };
    users.push(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

export const updateUser = async (id: string, data: Partial<UserData>): Promise<User | null> => {
    await delay(300);
    let userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    const updatedUser = { ...users[userIndex], ...data };
     if (!data.password || data.password.trim() === '') {
        updatedUser.password = users[userIndex].password;
    }
    users[userIndex] = updatedUser;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

export const deleteUser = async (id: string): Promise<boolean> => {
    await delay(300);
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    return users.length < initialLength;
};


// --- CLIENTS ---
let clients: Client[] = [
    { id: 'client-1', name: 'Empresa A', cnpj: '11.111.111/0001-11', address: 'Rua das Flores, 123, São Paulo, SP' },
    { id: 'client-2', name: 'Empresa B', cnpj: '22.222.222/0001-22', address: 'Avenida Principal, 456, Rio de Janeiro, RJ' },
    { id: 'client-3', name: 'Pessoa Física C', cnpj: '', address: 'Beco da Saudade, 789, Belo Horizonte, MG' },
    { id: 'client-4', name: 'Empresa D', cnpj: '44.444.444/0001-44', address: 'Praça Central, 101, Curitiba, PR' },
];

export const getClients = async (): Promise<Client[]> => {
    await delay(200);
    return [...clients];
};

export const getClientById = async (id: string): Promise<Client | null> => {
    await delay(200);
    const client = clients.find(c => c.id === id);
    return client || null;
}

export type ClientData = Omit<Client, 'id'>;

export const addClient = async (data: ClientData): Promise<Client> => {
    await delay(300);
    const newClient: Client = {
        ...data,
        id: `client-${Date.now()}`,
    };
    clients.push(newClient);
    return newClient;
};

export const updateClient = async (id: string, data: Partial<ClientData>): Promise<Client | null> => {
    await delay(300);
    let clientIndex = clients.findIndex(c => c.id === id);
    if (clientIndex === -1) return null;

    clients[clientIndex] = { ...clients[clientIndex], ...data };
    return clients[clientIndex];
};

export const deleteClient = async (id: string): Promise<boolean> => {
    await delay(300);
    const initialLength = clients.length;
    clients = clients.filter(c => c.id !== id);
    return clients.length < initialLength;
};


// --- SERVICE ORDERS ---
let serviceOrders: ServiceOrder[] = [
    {
        id: 'OS-001',
        clientId: 'client-1',
        collaborator: { name: 'João Silva', email: 'joao.silva@empresa-a.com', phone: '11-98765-4321' },
        equipment: { type: 'Notebook', brand: 'Dell', model: 'Latitude 7490', serialNumber: 'SN-DELL-123' },
        reportedProblem: 'Tela não liga, mas o LED de energia acende.',
        analyst: 'Suporte TSMIT',
        status: 'em_analise',
        createdAt: new Date('2023-10-01T09:00:00Z'),
        logs: [
            { timestamp: new Date('2023-10-01T09:00:00Z'), responsible: 'Suporte TSMIT', fromStatus: 'aberta', toStatus: 'em_analise', observation: 'Iniciando análise do equipamento.'}
        ]
    },
    {
        id: 'OS-002',
        clientId: 'client-2',
        collaborator: { name: 'Maria Souza', email: 'maria.souza@empresa-b.com.br', phone: '21-99999-8888' },
        equipment: { type: 'Desktop', brand: 'HP', model: 'ProDesk 400', serialNumber: 'SN-HP-456' },
        reportedProblem: 'Computador está muito lento e travando ao abrir programas pesados.',
        analyst: 'Suporte TSMIT',
        status: 'pronta_entrega',
        technicalSolution: 'Upgrade de memória RAM de 8GB para 16GB e troca do HD por um SSD de 512GB. Sistema operacional reinstalado e otimizado.',
        createdAt: new Date('2023-10-02T14:30:00Z'),
        logs: [
             { timestamp: new Date('2023-10-02T14:30:00Z'), responsible: 'Suporte TSMIT', fromStatus: 'aberta', toStatus: 'em_analise' },
             { timestamp: new Date('2023-10-03T11:00:00Z'), responsible: 'Laboratório TSMIT', fromStatus: 'em_analise', toStatus: 'pronta_entrega', observation: 'Nota/Solução: Upgrade de memória RAM de 8GB para 16GB e troca do HD por um SSD de 512GB. Sistema operacional reinstalado e otimizado.' },
        ]
    },
    {
        id: 'OS-003',
        clientId: 'client-3',
        collaborator: { name: 'Cliente C', email: 'cliente.c@email.com', phone: '31-91234-5678' },
        equipment: { type: 'Impressora', brand: 'Epson', model: 'EcoTank L3150', serialNumber: 'SN-EPS-789' },
        reportedProblem: 'Não está puxando o papel da bandeja.',
        analyst: 'Suporte TSMIT',
        status: 'aguardando_peca',
        createdAt: new Date('2023-10-04T10:00:00Z'),
        logs: [
            { timestamp: new Date('2023-10-04T10:00:00Z'), responsible: 'Suporte TSMIT', fromStatus: 'aberta', toStatus: 'em_analise' },
            { timestamp: new Date('2023-10-04T16:20:00Z'), responsible: 'Laboratório TSMIT', fromStatus: 'em_analise', toStatus: 'aguardando_peca', observation: 'Necessário trocar o rolo de tração. Peça solicitada.' },
        ]
    },
     {
        id: 'OS-004',
        clientId: 'client-4',
        collaborator: { name: 'Carlos Pereira', email: 'carlos.pereira@empresa-d.com', phone: '41-3322-1100' },
        equipment: { type: 'Servidor', brand: 'Lenovo', model: 'ThinkSystem SR550', serialNumber: 'SN-LNV-012' },
        reportedProblem: 'Um dos discos da RAID 5 está apresentando falha iminente no S.M.A.R.T.',
        analyst: 'Suporte TSMIT',
        status: 'entregue',
        technicalSolution: 'HD de 2TB do slot 3 substituído por um novo. Rebuild da RAID concluído com sucesso.',
        createdAt: new Date('2023-09-25T11:00:00Z'),
        logs: [
             { timestamp: new Date('2023-09-25T11:00:00Z'), responsible: 'Suporte TSMIT', fromStatus: 'aberta', toStatus: 'pronta_entrega', observation: 'Nota/Solução: HD de 2TB do slot 3 substituído por um novo. Rebuild da RAID concluído com sucesso.' },
             { timestamp: new Date('2023-09-26T14:00:00Z'), responsible: 'Suporte TSMIT', fromStatus: 'pronta_entrega', toStatus: 'entregue', observation: 'Entregue ao cliente.' }
        ]
    }
];

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
    await delay(500);
    const ordersWithClientName = serviceOrders.map(order => {
        const client = clients.find(c => c.id === order.clientId);
        return {
            ...order,
            clientName: client ? client.name : 'Cliente não encontrado'
        };
    });
    return ordersWithClientName.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getServiceOrderById = async (id: string): Promise<ServiceOrder | null> => {
    await delay(300);
    const order = serviceOrders.find(os => os.id === id);
    if (!order) return null;
    
    const client = clients.find(c => c.id === order.clientId);
    return {
        ...order,
        clientName: client ? client.name : 'Cliente não encontrado'
    };
};

export const addServiceOrder = async (data: Omit<ServiceOrder, 'id' | 'createdAt' | 'logs' | 'status'>) => {
    await delay(500);
    const newIdNumber = Math.max(...serviceOrders.map(o => parseInt(o.id.split('-')[1])), 0) + 1;
    const newId = `OS-${String(newIdNumber).padStart(3, '0')}`;
    const newOrder: ServiceOrder = {
        ...data,
        id: newId,
        status: 'aberta',
        createdAt: new Date(),
        logs: [
            { timestamp: new Date(), responsible: data.analyst, fromStatus: 'aberta', toStatus: 'aberta', observation: 'OS criada no sistema.'}
        ]
    };
    serviceOrders.unshift(newOrder);
    return newOrder;
};

export const updateServiceOrder = async (id: string, newStatus: ServiceOrderStatus, responsible: string, technicalSolution?: string, observation?: string) => {
    await delay(500);
    const orderIndex = serviceOrders.findIndex(os => os.id === id);
    if (orderIndex === -1) return null;

    const order = serviceOrders[orderIndex];
    const oldStatus = order.status;
    
    order.status = newStatus;
    if (technicalSolution !== undefined) {
      order.technicalSolution = technicalSolution;
    }
    
    order.logs.push({
        timestamp: new Date(),
        responsible,
        fromStatus: oldStatus,
        toStatus: newStatus,
        observation: observation
    });

    serviceOrders[orderIndex] = order;
    
    // Return with client name joined
    const client = clients.find(c => c.id === order.clientId);
    return {
        ...order,
        clientName: client ? client.name : 'Cliente não encontrado'
    };
};
