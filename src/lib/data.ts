"use client"
import { ServiceOrder, ServiceOrderStatus } from "./types";

let serviceOrders: ServiceOrder[] = [
    {
        id: 'OS-001',
        client: { name: 'Empresa A', email: 'contato@empresa-a.com', phone: '11-98765-4321' },
        equipment: { type: 'Notebook', brand: 'Dell', model: 'Latitude 7490', serialNumber: 'SN-DELL-123' },
        reportedProblem: 'Tela não liga, mas o LED de energia acende.',
        analyst: 'Carlos Silva',
        status: 'em_analise',
        createdAt: new Date('2023-10-01T09:00:00Z'),
        logs: [
            { timestamp: new Date('2023-10-01T09:00:00Z'), responsible: 'Carlos Silva', fromStatus: 'aberta', toStatus: 'em_analise', observation: 'Iniciando análise do equipamento.'}
        ]
    },
    {
        id: 'OS-002',
        client: { name: 'Empresa B', email: 'suporte@empresa-b.com.br', phone: '21-99999-8888' },
        equipment: { type: 'Desktop', brand: 'HP', model: 'ProDesk 400', serialNumber: 'SN-HP-456' },
        reportedProblem: 'Computador está muito lento e travando ao abrir programas pesados.',
        analyst: 'Fernanda Lima',
        status: 'pronta_entrega',
        technicalSolution: 'Upgrade de memória RAM de 8GB para 16GB e troca do HD por um SSD de 512GB. Sistema operacional reinstalado e otimizado.',
        createdAt: new Date('2023-10-02T14:30:00Z'),
        logs: [
             { timestamp: new Date('2023-10-02T14:30:00Z'), responsible: 'Fernanda Lima', fromStatus: 'aberta', toStatus: 'em_analise' },
             { timestamp: new Date('2023-10-03T11:00:00Z'), responsible: 'Fernanda Lima', fromStatus: 'em_analise', toStatus: 'finalizada' },
             { timestamp: new Date('2023-10-03T11:05:00Z'), responsible: 'Sistema', fromStatus: 'finalizada', toStatus: 'pronta_entrega', observation: 'Solução técnica preenchida.' },
        ]
    },
    {
        id: 'OS-003',
        client: { name: 'Pessoa Física C', email: 'cliente.c@email.com', phone: '31-91234-5678' },
        equipment: { type: 'Impressora', brand: 'Epson', model: 'EcoTank L3150', serialNumber: 'SN-EPS-789' },
        reportedProblem: 'Não está puxando o papel da bandeja.',
        analyst: 'Carlos Silva',
        status: 'aguardando_peca',
        createdAt: new Date('2023-10-04T10:00:00Z'),
        logs: [
            { timestamp: new Date('2023-10-04T10:00:00Z'), responsible: 'Carlos Silva', fromStatus: 'aberta', toStatus: 'em_analise' },
            { timestamp: new Date('2023-10-04T16:20:00Z'), responsible: 'Marcos Paulo', fromStatus: 'em_analise', toStatus: 'aguardando_peca', observation: 'Necessário trocar o rolo de tração. Peça solicitada.' },
        ]
    },
     {
        id: 'OS-004',
        client: { name: 'Empresa D', email: 'ti@empresa-d.com', phone: '41-3322-1100' },
        equipment: { type: 'Servidor', brand: 'Lenovo', model: 'ThinkSystem SR550', serialNumber: 'SN-LNV-012' },
        reportedProblem: 'Um dos discos da RAID 5 está apresentando falha iminente no S.M.A.R.T.',
        analyst: 'Fernanda Lima',
        status: 'entregue',
        technicalSolution: 'HD de 2TB do slot 3 substituído por um novo. Rebuild da RAID concluído com sucesso.',
        createdAt: new Date('2023-09-25T11:00:00Z'),
        logs: [
             { timestamp: new Date('2023-09-25T11:00:00Z'), responsible: 'Fernanda Lima', fromStatus: 'aberta', toStatus: 'finalizada' },
             { timestamp: new Date('2023-09-25T18:00:00Z'), responsible: 'Sistema', from_status: 'finalizada', to_status: 'pronta_entrega' },
             { timestamp: new Date('2023-09-26T14:00:00Z'), responsible: 'Carlos Silva', fromStatus: 'pronta_entrega', toStatus: 'entregue', observation: 'Entregue ao cliente.' }
        ].map(l => ({ ...l, fromStatus: l.from_status || l.fromStatus, toStatus: l.to_status || l.toStatus }))
    }
];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getServiceOrders = async () => {
    await delay(500);
    return serviceOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getServiceOrderById = async (id: string) => {
    await delay(300);
    return serviceOrders.find(os => os.id === id);
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

export const updateServiceOrder = async (id: string, newStatus: ServiceOrderStatus, responsible: string, technicalSolution?: string) => {
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
        observation: technicalSolution ? 'Solução técnica preenchida/atualizada.' : 'Status atualizado manualmente.'
    });

    if (technicalSolution && newStatus !== 'pronta_entrega') {
        order.status = 'pronta_entrega';
        order.logs.push({
            timestamp: new Date(),
            responsible: 'Sistema',
            fromStatus: newStatus,
            toStatus: 'pronta_entrega',
            observation: 'Status alterado para "Pronta para Entrega" devido ao preenchimento da solução técnica.'
        });
    }

    serviceOrders[orderIndex] = order;
    return order;
};
