/**
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! AVISO DE SEGURANÇA CRÍTICO:                                                                                 !!
 * !! As operações de `registerUser` e `deleteUser` neste arquivo estão sendo executadas DIRETAMENTE NO FRONTEND. !!
 * !! Esta é uma PRÁTICA EXTREMAMENTE INSEGURA para gerenciar usuários do Firebase Authentication, pois:         !!
 * !!                                                                                                            !!
 * !! 1. EXPOSIÇÃO DE CREDENCIAIS: A criação e exclusão de usuários com privilégios administrativos requer       !!
 * !!    credenciais que NUNCA devem ser expostas no código do cliente. Fazer isso permite que qualquer um com   !!
 * !!    acesso ao seu frontend (via navegador, ferramentas de desenvolvedor, etc.) execute operações admin.    !!
 * !! 2. VULNERABILIDADE: Malfeitores podem explorar esta falha para criar ou deletar contas de usuário        !!
 * !!    arbitrariamente, comprometendo a integridade e a segurança do seu sistema.                            !!
 * !! 3. LIMITAÇÃO DA API: A API de cliente do Firebase Authentication não permite a exclusão de usuários        !!
 * !!    arbitrários (apenas o usuário atualmente logado pode se auto-excluir). Para excluir outros usuários,  !!
 * !!    É OBRIGATÓRIO USAR O FIREBASE ADMIN SDK, que DEVE rodar em um ambiente de servidor seguro (ex: Cloud Functions).
 * !!                                                                                                            !!
 * !! RECOMENDAÇÃO FORTEMENTE:                                                                                     !!
 * !! Para gerenciar usuários de forma segura (criar, deletar, etc.) em um painel de administração,             !!
 * !! É IMPRESCINDÍVEL USAR FIREBASE CLOUD FUNCTIONS (ou outro backend seguro) que utilize o Firebase Admin SDK. !!
 * !! Considerar esta implementação apenas para PROTÓTIPOS. NÃO IMPLANTE EM PRODUÇÃO NESTA CONFIGURAÇÃO.        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
"use client"
import { ServiceOrder, ServiceOrderStatus, User, Client, LogEntry, Role, Permissions, UpdateServiceOrderResult, ContractedServices, EditLogEntry, EditLogChange } from "./types";
import { db, auth } from "./firebase"; 
import { collection, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, runTransaction, arrayUnion, setDoc, addDoc } from "firebase/firestore"; 
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser, sendPasswordResetEmail } from "firebase/auth"; // Import specific auth functions


// --- ROLES ---

export const getRoles = async (): Promise<Role[]> => {
    const rolesCollection = collection(db, "roles");
    const q = query(rolesCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Role[];
};

export const getRoleById = async (id: string): Promise<Role | null> => {
    const roleDocRef = doc(db, "roles", id);
    const roleSnap = await getDoc(roleDocRef);

    if (roleSnap.exists()) {
        return { ...roleSnap.data(), id: roleSnap.id } as Role;
    }
    return null;
};

export type RoleData = Omit<Role, 'id'>;

export const addRole = async (data: RoleData): Promise<Role> => {
    const rolesCollection = collection(db, "roles");
    const newRoleRef = await addDoc(rolesCollection, data);
    return { ...data, id: newRoleRef.id } as Role;
};

export const updateRole = async (id: string, data: Partial<RoleData>): Promise<Role | null> => {
    const roleDocRef = doc(db, "roles", id);
    await updateDoc(roleDocRef, data);
    const updatedSnap = await getDoc(roleDocRef);
    if (updatedSnap.exists()) {
        return { ...updatedSnap.data(), id: updatedSnap.id } as Role;
    }
    return null;
};

export const deleteRole = async (id: string): Promise<boolean> => {
    const roleDocRef = doc(db, "roles", id);
    try {
        await deleteDoc(roleDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting role:", error);
        return false;
    }
};

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, orderBy("name", "asc")); 
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    const rolesMap = new Map<string, Role>();

    for (const docSnapshot of querySnapshot.docs) {
        const docData = docSnapshot.data() as User & { password?: string };
        const { password, ...userData } = docData; 
        const user: User = { ...userData, id: docSnapshot.id };

        if (user.roleId && !rolesMap.has(user.roleId)) {
            const role = await getRoleById(user.roleId);
            if (role) {
                rolesMap.set(user.roleId, role);
            }
        }
        user.role = rolesMap.get(user.roleId) || null; // Fix: Ensure role is null if not found
        users.push(user);
    }
    return users;
};

export const getUserById = async (id: string): Promise<User | null> => {
    const userDocRef = doc(db, "users", id);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
        const docData = userSnap.data() as User & { password?: string };
        const { password, ...userData } = docData; 
        const user: User = { ...userData, id: userSnap.id };

        if (user.roleId) {
            user.role = (await getRoleById(user.roleId)) || null; // Fix: Ensure role is null if not found
        }
        return user;
    }
    return null;
};

export type UserData = {
    name: string;
    email: string;
    roleId: string; // Changed to roleId
};

export const registerUser = async (data: Omit<UserData, 'password'>, password: string): Promise<User> => {
    console.warn("AVISO DE SEGURANÇA: Registrando usuário diretamente no frontend. ISSO NÃO É SEGURO PARA PRODUÇÃO.");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
        const newUserUid = userCredential.user.uid;

        await setDoc(doc(db, "users", newUserUid), {
            name: data.name,
            email: data.email,
            roleId: data.roleId, // Changed to roleId
            createdAt: new Date(),
        });

        const role = await getRoleById(data.roleId);
        return { ...data, id: newUserUid, role: role || null } as User; // Fix: Ensure role is null here too
    } catch (error: any) {
        console.error("Erro no registro de usuário (frontend):", error);
        throw new Error(error.message || "Ocorreu um erro ao registrar o usuário.");
    }
};

export const updateUser = async (id: string, data: Partial<UserData>): Promise<User | null> => {
    const userDocRef = doc(db, "users", id);
    await updateDoc(userDocRef, data);

    const updatedSnap = await getDoc(userDocRef);
    if (updatedSnap.exists()) {
        const docData = updatedSnap.data() as User & { password?: string };
        const { password, ...updatedUserData } = docData;
        const updatedUser: User = { ...updatedUserData, id: updatedSnap.id };

        if (updatedUser.roleId) {
            updatedUser.role = (await getRoleById(updatedUser.roleId)) || null; // Fix: Ensure role is null if not found
        }
        return updatedUser;
    }
    return null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
    console.warn("AVISO DE SEGURANÇA: Tentando deletar usuário diretamente no frontend. ISSO NÃO É SEGURO NEM POSSÍVEL PARA USUÁRIOS ARBITRÁRIOS NA API DE CLIENTE.");
    try {
        if (auth.currentUser && auth.currentUser.uid === id) {
            await deleteAuthUser(auth.currentUser);
            await deleteDoc(doc(db, "users", id)); 
            return true;
        } else {
            throw new Error("A exclusão de usuários arbitrários não é permitida diretamente do frontend por segurança.");
        }
    } catch (error: any) {
        console.error("Erro ao deletar usuário (frontend):", error);
        throw new Error(error.message || "Não foi possível deletar o usuário.");
    }
};


// --- CLIENTS ---

export const getClients = async (): Promise<Client[]> => {
    const clientsCollection = collection(db, "clients");
    const q = query(clientsCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Client[];
};

export const getClientById = async (id: string): Promise<Client | null> => {
    const clientDocRef = doc(db, "clients", id);
    const clientSnap = await getDoc(clientDocRef);
    if (clientSnap.exists()) {
        return { ...clientSnap.data(), id: clientSnap.id } as Client;
    }
    return null;
};

export type ClientData = Omit<Client, 'id'>;

export const addClient = async (data: ClientData): Promise<Client> => {
    const clientsCollection = collection(db, "clients");
    const newClientRef = await addDoc(clientsCollection, data);
    return { ...data, id: newClientRef.id } as Client;
};

export const updateClient = async (id: string, data: Partial<ClientData>): Promise<Client | null> => {
    const clientDocRef = doc(db, "clients", id);
    await updateDoc(clientDocRef, data);
    const updatedSnap = await getDoc(clientDocRef);
    if (updatedSnap.exists()) {
        return { ...updatedSnap.data(), id: updatedSnap.id } as Client;
    }
    return null;
};

export const deleteClient = async (id: string): Promise<boolean> => {
    const clientDocRef = doc(db, "clients", id);
    try {
        await deleteDoc(clientDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting client:", error);
        return false;
    }
};


// --- SERVICE ORDERS ---

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
    // 1. Fetch all clients and create a map for quick lookups
    const clients = await getClients();
    const clientMap = new Map<string, Client>(); // Change to store full client object
    clients.forEach(client => {
        clientMap.set(client.id, client);
    });

    // 2. Fetch all service orders
    const serviceOrdersCollection = collection(db, "serviceOrders");
    const q = query(serviceOrdersCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    // 3. Map orders and efficiently look up client names and contracted services from the map
    const serviceOrdersData = querySnapshot.docs.map(doc => {
        const order = {
            ...doc.data(),
            id: doc.id,
        } as ServiceOrder;

        const client = clientMap.get(order.clientId);

        return {
            ...order,
            clientName: client ? client.name : 'Cliente não encontrado',
            contractedServices: client ? { // Set contracted services from client profile
                webProtection: client.webProtection || false,
                backup: client.backup || false,
                edr: client.edr || false,
            } : { webProtection: false, backup: false, edr: false },
            // Ensure createdAt and log timestamps are Date objects for consistency
            createdAt: order.createdAt instanceof Date ? order.createdAt : (order.createdAt as any).toDate(),
            logs: order.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })),
            attachments: order.attachments || [] // Ensure attachments is an empty array if undefined
        };
    });
    
    return serviceOrdersData;
};

export const getServiceOrderById = async (id: string): Promise<ServiceOrder | null> => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    const serviceOrderSnap = await getDoc(serviceOrderDocRef);

    if (serviceOrderSnap.exists()) {
        const orderData = serviceOrderSnap.data() as ServiceOrder;
        const client = await getClientById(orderData.clientId);
        
        return {
            ...orderData, 
            id: serviceOrderSnap.id,
            clientName: client ? client.name : 'Cliente não encontrado',
            contractedServices: client ? { // Set contracted services from client profile
                webProtection: client.webProtection || false,
                backup: client.backup || false,
                edr: client.edr || false,
            } : { webProtection: false, backup: false, edr: false },
            // Ensure createdAt and log timestamps are Date objects
            createdAt: orderData.createdAt instanceof Date ? orderData.createdAt : (orderData.createdAt as any).toDate(),
            logs: orderData.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })),
            attachments: orderData.attachments || [], // Ensure attachments is an empty array if undefined
            editLogs: orderData.editLogs?.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })) || []
        } as ServiceOrder;
    }

    return null;
};

// Define a type for the updatable fields of a ServiceOrder (excluding read-only fields)
export type UpdateServiceOrderDetailsData = Partial<Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'logs' | 'status' | 'attachments' | 'contractedServices' | 'confirmedServices' | 'analyst' | 'editLogs'>> & {
    collaborator?: { // Make sure collaborator and equipment are properly defined if they're partial
        name?: string;
        email?: string;
        phone?: string;
    };
    equipment?: {
        type?: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
    };
};

export const updateServiceOrderDetails = async (id: string, data: UpdateServiceOrderDetailsData, responsibleUserName: string): Promise<ServiceOrder | null> => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    const currentOrderSnap = await getDoc(serviceOrderDocRef);

    if (!currentOrderSnap.exists()) {
        throw new Error("Service Order not found.");
    }

    const oldOrderData = currentOrderSnap.data() as ServiceOrder;

    // Prevent modification if status is 'entregue'
    if (oldOrderData.status === 'entregue') {
        throw new Error("OS não pode ser modificada após o status 'Entregue'.");
    }

    const changes: EditLogChange[] = [];

    // Helper to compare fields, including nested objects like 'collaborator' and 'equipment'
    const compareField = (fieldName: string, oldVal: any, newVal: any) => {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
                field: fieldName,
                oldValue: oldVal === undefined ? null : oldVal,
                newValue: newVal === undefined ? null : newVal,
            });
        }
    };

    // Compare top-level fields
    compareField('clientId', oldOrderData.clientId, data.clientId);
    compareField('reportedProblem', oldOrderData.reportedProblem, data.reportedProblem);
    compareField('technicalSolution', oldOrderData.technicalSolution, data.technicalSolution);


    // Compare nested collaborator fields
    if (data.collaborator) {
        compareField('collaborator.name', oldOrderData.collaborator.name, data.collaborator.name);
        compareField('collaborator.email', oldOrderData.collaborator.email, data.collaborator.email);
        compareField('collaborator.phone', oldOrderData.collaborator.phone, data.collaborator.phone);
    }

    // Compare nested equipment fields
    if (data.equipment) {
        compareField('equipment.type', oldOrderData.equipment.type, data.equipment.type);
        compareField('equipment.brand', oldOrderData.equipment.brand, data.equipment.brand);
        compareField('equipment.model', oldOrderData.equipment.model, data.equipment.model);
        compareField('equipment.serialNumber', oldOrderData.equipment.serialNumber, data.equipment.serialNumber);
    }

    // Only proceed with update and log if there are actual changes
    if (changes.length > 0) {
        const newEditLogEntry: EditLogEntry = {
            timestamp: new Date(),
            responsible: responsibleUserName,
            changes: changes,
            observation: "Detalhes da OS editados.", // Or a more specific observation
        };

        await updateDoc(serviceOrderDocRef, {
            ...data,
            editLogs: arrayUnion(newEditLogEntry) // Add new edit log entry
        });
    } else {
        console.log("No significant changes detected for OS details. Skipping update.");
        // If no changes, return the current data to avoid unnecessary re-fetch
        const client = await getClientById(oldOrderData.clientId);
        return {
            ...oldOrderData,
            id: oldOrderData.id,
            clientName: client ? client.name : 'Cliente não encontrado',
            contractedServices: client ? { 
                webProtection: client.webProtection || false,
                backup: client.backup || false,
                edr: client.edr || false,
            } : { webProtection: false, backup: false, edr: false },
            createdAt: oldOrderData.createdAt instanceof Date ? oldOrderData.createdAt : (oldOrderData.createdAt as any).toDate(),
            logs: oldOrderData.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })),
            attachments: oldOrderData.attachments || [],
            editLogs: oldOrderData.editLogs?.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })) || []
        } as ServiceOrder;
    }
    
    // Fetch the updated document to return the full object with clientName and other computed fields
    const updatedServiceOrderSnap = await getDoc(serviceOrderDocRef);
    if (updatedServiceOrderSnap.exists()) {
        const updatedOrderData = updatedServiceOrderSnap.data() as ServiceOrder;
        const client = await getClientById(updatedOrderData.clientId);

        return {
            ...updatedOrderData, 
            id: updatedServiceOrderSnap.id,
            clientName: client ? client.name : 'Cliente não encontrado',
            contractedServices: client ? { 
                webProtection: client.webProtection || false,
                backup: client.backup || false,
                edr: client.edr || false,
            } : { webProtection: false, backup: false, edr: false },
            createdAt: updatedOrderData.createdAt instanceof Date ? updatedOrderData.createdAt : (updatedOrderData.createdAt as any).toDate(),
            logs: updatedOrderData.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })),
            attachments: updatedOrderData.attachments || [],
            editLogs: updatedOrderData.editLogs?.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })) || []
        } as ServiceOrder;
    }
    return null;
};

export const addServiceOrder = async (
    data: Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'logs' | 'status' | 'attachments' | 'contractedServices' | 'confirmedServices' | 'editLogs'>
  ): Promise<ServiceOrder> => {
    const serviceOrdersCollection = collection(db, "serviceOrders");
  
    // 🚨 Executar fora da transação!
    const lastOrderQuery = query(serviceOrdersCollection, orderBy("orderNumber", "desc"), limit(1));
    const lastOrderSnapshot = await getDocs(lastOrderQuery);
  
    let nextOrderNumber = 1;
    if (!lastOrderSnapshot.empty) {
      const lastOrderData = lastOrderSnapshot.docs[0].data() as ServiceOrder;
      const lastNum = parseInt(lastOrderData.orderNumber.replace('OS-', ''));
      nextOrderNumber = lastNum + 1;
    }
  
    const formattedOrderNumber = `OS-${String(nextOrderNumber).padStart(3, '0')}`;
  
    // Fetch client to get contracted services at the time of OS creation
    const client = await getClientById(data.clientId);
    const contractedServicesAtCreation: ContractedServices = client ? {
        webProtection: client.webProtection || false,
        backup: client.backup || false,
        edr: client.edr || false,
    } : { webProtection: false, backup: false, edr: false };

    // Now, run the transaction
    const newOrder = await runTransaction(db, async (tx) => {
      const newOrderData: Omit<ServiceOrder, 'id'> = {
        ...data,
        orderNumber: formattedOrderNumber,
        status: 'aberta',
        createdAt: new Date(),
        logs: [
          {
            timestamp: new Date(),
            responsible: data.analyst,
            fromStatus: 'aberta',
            toStatus: 'aberta',
            observation: 'OS criada no sistema.',
          }
        ],
        attachments: [], // Initialize attachments as an empty array
        contractedServices: contractedServicesAtCreation, // Save contracted services from client profile at creation
        confirmedServices: { webProtection: false, backup: false, edr: false }, // Initialize all as false
        editLogs: [] // Initialize editLogs as an empty array
      };
  
      const newServiceOrderRef = doc(serviceOrdersCollection);
      tx.set(newServiceOrderRef, newOrderData);
  
      return { ...newOrderData, id: newServiceOrderRef.id };
    });
  
    return newOrder;
  };

export const updateServiceOrder = async (id: string, newStatus: ServiceOrderStatus, responsible: string, technicalSolution?: string, observation?: string, attachments?: string[], confirmedServices?: ContractedServices): Promise<UpdateServiceOrderResult> => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    
    const currentOrderSnap = await getDoc(serviceOrderDocRef);
    if (!currentOrderSnap.exists()) return { updatedOrder: null, emailSent: false, emailErrorMessage: "Ordem de serviço não encontrada." };

    const currentOrderData = currentOrderSnap.data() as ServiceOrder;
    const oldStatus = currentOrderData.status;

    // Prevent modification if status is 'entregue'
    if (oldStatus === 'entregue') {
        return { updatedOrder: null, emailSent: false, emailErrorMessage: "OS com status 'Entregue' não pode ser modificada." };
    }

    // Define valid status transitions
    const validTransitions: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
        'aberta': ['em_analise'],
        'em_analise': ['aguardando_peca', 'aguardando_terceiros', 'pronta_entrega'],
        'aguardando_peca': ['em_analise', 'pronta_entrega'],
        'aguardando_terceiros': ['em_analise', 'pronta_entrega'],
        'pronta_entrega': ['entregue'],
        'entregue': [], // No transitions from 'entregue'
    };

    const allowedNextStatuses = validTransitions[oldStatus];

    if (!allowedNextStatuses || !allowedNextStatuses.includes(newStatus)) {
        return { updatedOrder: null, emailSent: false, emailErrorMessage: `Transição de status inválida de '${oldStatus}' para '${newStatus}'.` };
    }

    const newLogEntry: LogEntry = {
        timestamp: new Date(),
        responsible,
        fromStatus: oldStatus,
        toStatus: newStatus,
        observation: observation ?? undefined, 
    };

    const updatePayload: any = {
        status: newStatus,
        logs: arrayUnion(newLogEntry) // Use arrayUnion to safely add to the array
    };

    if (technicalSolution !== undefined) {
        updatePayload.technicalSolution = technicalSolution;
    }

    if (attachments !== undefined) {
        updatePayload.attachments = attachments;
    }

    if (confirmedServices !== undefined) {
        updatePayload.confirmedServices = confirmedServices;
    }

    await updateDoc(serviceOrderDocRef, updatePayload);

    // Fetch the updated document to return the full object with clientName
    const updatedServiceOrderSnap = await getDoc(serviceOrderDocRef);
    if (updatedServiceOrderSnap.exists()) {
        const updatedOrderData = updatedServiceOrderSnap.data() as ServiceOrder;
        const client = await getClientById(updatedOrderData.clientId);

        let emailSent = false;
        let emailErrorMessage: string | undefined;

        // Determine the recipient email for the frontend check
        const recipientEmail = client?.email || updatedOrderData.collaborator.email;

        // Send email notification if status is 'entregue'
        if (newStatus === 'entregue' && recipientEmail) {
            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ serviceOrder: updatedOrderData, client }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    emailErrorMessage = `Falha ao enviar e-mail: ${errorData.message || response.statusText}`;
                    console.error(emailErrorMessage);
                } else {
                    emailSent = true;
                    console.log('Email de notificação enviado com sucesso para o cliente.');
                }
            } catch (error) {
                emailErrorMessage = `Erro de rede ao tentar enviar e-mail: ${(error as Error).message}`;
                console.error(emailErrorMessage);
            }
        } else if (newStatus === 'entregue' && !recipientEmail) {
            emailErrorMessage = 'Nenhum e-mail de destinatário válido fornecido para notificação.';
            console.warn(emailErrorMessage);
        }

        return {
            updatedOrder: {
                ...updatedOrderData, 
                id: updatedServiceOrderSnap.id,
                clientName: client ? client.name : 'Cliente não encontrado',
                // Ensure createdAt and log timestamps are Date objects
                createdAt: updatedOrderData.createdAt instanceof Date ? updatedOrderData.createdAt : (updatedOrderData.createdAt as any).toDate(),
                logs: updatedOrderData.logs.map(log => ({
                    ...log,
                    timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
                })),
                attachments: updatedOrderData.attachments || [], // Ensure attachments is an empty array if undefined
                editLogs: updatedOrderData.editLogs?.map(log => ({
                    ...log,
                    timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
                })) || []
            } as ServiceOrder,
            emailSent,
            emailErrorMessage,
        };
    }

    return { updatedOrder: null, emailSent: false, emailErrorMessage: "Ordem de serviço atualizada, mas não foi possível buscar os dados completos." };
};

export const deleteServiceOrder = async (id: string): Promise<boolean> => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    try {
        await deleteDoc(serviceOrderDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting service order:", error);
        return false;
    }
};