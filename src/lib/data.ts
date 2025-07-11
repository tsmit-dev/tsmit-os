"use client"
import { ServiceOrder, User, Client, LogEntry, Role, UpdateServiceOrderResult, ProvidedService, EditLogEntry, EditLogChange, Status } from "./types";
import { db, auth } from "./firebase"; 
import { collection, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, runTransaction, arrayUnion, setDoc, addDoc, writeBatch } from "firebase/firestore"; 
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from "firebase/auth";


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
        user.role = rolesMap.get(user.roleId) || null;
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
            user.role = (await getRoleById(user.roleId)) || null;
        }
        return user;
    }
    return null;
};

export type UserData = {
    name: string;
    email: string;
    roleId: string;
};

export const registerUser = async (data: Omit<UserData, 'password'>, password: string): Promise<User> => {
    console.warn("AVISO DE SEGURANÇA: Registrando usuário diretamente no frontend. ISSO NÃO É SEGURO PARA PRODUÇÃO.");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
        const newUserUid = userCredential.user.uid;

        await setDoc(doc(db, "users", newUserUid), {
            name: data.name,
            email: data.email,
            roleId: data.roleId,
            createdAt: new Date(),
        });

        const role = await getRoleById(data.roleId);
        return { ...data, id: newUserUid, role: role || null } as User;
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
            updatedUser.role = (await getRoleById(updatedUser.roleId)) || null;
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

// --- PROVIDED SERVICES ---

export const getProvidedServices = async (): Promise<ProvidedService[]> => {
    const servicesCollection = collection(db, "providedServices");
    const q = query(servicesCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProvidedService[];
};

export const addProvidedService = async (data: Omit<ProvidedService, 'id'>): Promise<ProvidedService> => {
    const servicesCollection = collection(db, "providedServices");
    const newServiceRef = await addDoc(servicesCollection, data);
    return { ...data, id: newServiceRef.id } as ProvidedService;
};

export const deleteProvidedService = async (id: string): Promise<boolean> => {
    const serviceDocRef = doc(db, "providedServices", id);
    try {
        await deleteDoc(serviceDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting provided service:", error);
        return false;
    }
};

export const assignServiceToClients = async (serviceId: string, clientIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    clientIds.forEach(clientId => {
        const clientRef = doc(db, 'clients', clientId);
        batch.update(clientRef, {
            contractedServiceIds: arrayUnion(serviceId)
        });
    });
    await batch.commit();
};

// --- STATUSES ---
export const getStatuses = async (): Promise<Status[]> => {
    const statusesCollection = collection(db, "statuses");
    const q = query(statusesCollection, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Status[];
};

export type StatusData = Omit<Status, 'id'>;

export const addStatus = async (data: StatusData): Promise<Status> => {
    const statusesCollection = collection(db, "statuses");
    const newStatusRef = await addDoc(statusesCollection, data);
    return { ...data, id: newStatusRef.id } as Status;
};

export const updateStatus = async (id: string, data: Partial<StatusData>): Promise<Status | null> => {
    const statusDocRef = doc(db, "statuses", id);
    await updateDoc(statusDocRef, data);
    const updatedSnap = await getDoc(statusDocRef);
    if (updatedSnap.exists()) {
        return { ...updatedSnap.data(), id: updatedSnap.id } as Status;
    }
    return null;
};

export const deleteStatus = async (id: string): Promise<boolean> => {
    const statusDocRef = doc(db, "statuses", id);
    try {
        await deleteDoc(statusDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting status:", error);
        return false;
    }
};


// --- SERVICE ORDERS ---

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
    const [clients, statuses, serviceOrdersSnapshot] = await Promise.all([
        getClients(),
        getStatuses(),
        getDocs(query(collection(db, "serviceOrders"), orderBy("createdAt", "desc")))
    ]);

    const clientMap = new Map<string, Client>(clients.map(c => [c.id, c]));
    const statusMap = new Map<string, Status>(statuses.map(s => [s.id, s]));

    const defaultStatus: Status = { id: 'unknown', name: 'Desconhecido', color: '#808080', order: 999, triggersEmail: false, isPickupStatus: false };

    return serviceOrdersSnapshot.docs.map(doc => {
        const orderData = { ...doc.data(), id: doc.id } as any; 
        const client = clientMap.get(orderData.clientId);
        const status = statusMap.get(orderData.statusId) || defaultStatus;

        return {
            ...orderData,
            clientName: client ? client.name : 'Cliente não encontrado',
            status: status,
            createdAt: orderData.createdAt?.toDate(),
            logs: orderData.logs?.map((log: any) => ({
                ...log,
                timestamp: log.timestamp?.toDate(),
            })) || [],
            attachments: orderData.attachments || [],
            contractedServices: orderData.contractedServices || [],
            confirmedServiceIds: orderData.confirmedServiceIds || [],
            editLogs: orderData.editLogs?.map((log: any) => ({
                ...log,
                timestamp: log.timestamp?.toDate(),
            })) || []
        } as ServiceOrder;
    });
};

export const getServiceOrderById = async (id: string): Promise<ServiceOrder | null> => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    const serviceOrderSnap = await getDoc(serviceOrderDocRef);

    if (serviceOrderSnap.exists()) {
        const orderData = serviceOrderSnap.data() as any;
        const [client, statuses] = await Promise.all([
            getClientById(orderData.clientId),
            getStatuses()
        ]);
        
        const statusMap = new Map<string, Status>(statuses.map(s => [s.id, s]));
        const status = statusMap.get(orderData.statusId) || { id: 'unknown', name: 'Desconhecido', color: '#808080', order: 999, triggersEmail: false, isPickupStatus: false };
        
        return {
            ...orderData, 
            id: serviceOrderSnap.id,
            clientName: client ? client.name : 'Cliente não encontrado',
            status: status,
            createdAt: orderData.createdAt?.toDate(),
            logs: orderData.logs?.map((log: any) => ({
                ...log,
                timestamp: log.timestamp?.toDate(),
            })) || [],
            attachments: orderData.attachments || [],
            contractedServices: orderData.contractedServices || [],
            confirmedServiceIds: orderData.confirmedServiceIds || [],
            editLogs: orderData.editLogs?.map((log: any) => ({
                ...log,
                timestamp: log.timestamp?.toDate(),
            })) || []
        } as ServiceOrder;
    }

    return null;
};

export type UpdateServiceOrderDetailsData = Partial<Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'logs' | 'status' | 'attachments' | 'contractedServices' | 'confirmedServiceIds' | 'analyst' | 'editLogs'>> & {
    collaborator?: {
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

    const oldOrderData = (await getServiceOrderById(id))!; // get enriched data

    const changes: EditLogChange[] = [];

    const compareField = (fieldName: string, oldVal: any, newVal: any) => {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
                field: fieldName,
                oldValue: oldVal === undefined ? null : oldVal,
                newValue: newVal === undefined ? null : newVal,
            });
        }
    };

    compareField('clientId', oldOrderData.clientId, data.clientId);
    compareField('reportedProblem', oldOrderData.reportedProblem, data.reportedProblem);
    compareField('technicalSolution', oldOrderData.technicalSolution, data.technicalSolution);

    if (data.collaborator) {
        compareField('collaborator.name', oldOrderData.collaborator.name, data.collaborator.name);
        compareField('collaborator.email', oldOrderData.collaborator.email, data.collaborator.email);
        compareField('collaborator.phone', oldOrderData.collaborator.phone, data.collaborator.phone);
    }

    if (data.equipment) {
        compareField('equipment.type', oldOrderData.equipment.type, data.equipment.type);
        compareField('equipment.brand', oldOrderData.equipment.brand, data.equipment.brand);
        compareField('equipment.model', oldOrderData.equipment.model, data.equipment.model);
        compareField('equipment.serialNumber', oldOrderData.equipment.serialNumber, data.equipment.serialNumber);
    }

    if (changes.length > 0) {
        const newEditLogEntry: EditLogEntry = {
            timestamp: new Date(),
            responsible: responsibleUserName,
            changes: changes,
            observation: "Detalhes da OS editados.",
        };

        await updateDoc(serviceOrderDocRef, {
            ...data,
            editLogs: arrayUnion(newEditLogEntry)
        });
    }
    
    return getServiceOrderById(id);
};

export const addServiceOrder = async (
    data: Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'logs' | 'status' | 'attachments' | 'contractedServices' | 'confirmedServiceIds' | 'editLogs'> & { statusId: string }
  ): Promise<ServiceOrder> => {
    const serviceOrdersCollection = collection(db, "serviceOrders");
  
    const lastOrderQuery = query(serviceOrdersCollection, orderBy("orderNumber", "desc"), limit(1));
    const lastOrderSnapshot = await getDocs(lastOrderQuery);
  
    let nextOrderNumber = 1;
    if (!lastOrderSnapshot.empty) {
      const lastOrderData = lastOrderSnapshot.docs[0].data() as ServiceOrder;
      const lastNum = parseInt(lastOrderData.orderNumber.replace('OS-', ''));
      nextOrderNumber = lastNum + 1;
    }
  
    const formattedOrderNumber = `OS-${String(nextOrderNumber).padStart(3, '0')}`;
  
    const client = await getClientById(data.clientId);
    let contractedServicesAtCreation: ProvidedService[] = [];
    if (client?.contractedServiceIds?.length) {
        const servicesQuery = query(collection(db, 'providedServices'), where('__name__', 'in', client.contractedServiceIds));
        const servicesSnapshot = await getDocs(servicesQuery);
        contractedServicesAtCreation = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProvidedService));
    }

    const newOrderRef = doc(serviceOrdersCollection);
    const newOrderData = {
        clientId: data.clientId,
        collaborator: data.collaborator,
        equipment: data.equipment,
        reportedProblem: data.reportedProblem,
        analyst: data.analyst,
        orderNumber: formattedOrderNumber,
        statusId: data.statusId, 
        createdAt: new Date(),
        logs: [
          {
            timestamp: new Date(),
            responsible: data.analyst,
            fromStatus: data.statusId,
            toStatus: data.statusId,
            observation: 'OS criada no sistema.',
          }
        ],
        attachments: [],
        contractedServices: contractedServicesAtCreation,
        confirmedServiceIds: [],
        editLogs: []
      };

    await setDoc(newOrderRef, newOrderData);
  
    return (await getServiceOrderById(newOrderRef.id))!;
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

export const updateServiceOrder = async (
    id: string, 
    newStatusId: string, 
    responsible: string, 
    technicalSolution?: string, 
    observation?: string, 
    attachments?: string[], 
    confirmedServiceIds?: string[]
): Promise<UpdateServiceOrderResult> => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    
    try {
        const currentOrderSnap = await getDoc(serviceOrderDocRef);
        if (!currentOrderSnap.exists()) {
            return { updatedOrder: null, emailSent: false, emailErrorMessage: "Ordem de serviço não encontrada." };
        }

        const currentOrderData = currentOrderSnap.data();
        const oldStatusId = currentOrderData.statusId;

        const newLogEntry: Omit<LogEntry, 'id'> = {
            timestamp: new Date(),
            responsible,
            fromStatus: oldStatusId,
            toStatus: newStatusId,
        };

        if (observation) {
            newLogEntry.observation = observation;
        }

        const updatePayload: any = {};
        let hasChanges = false;

        if (newStatusId !== oldStatusId) {
            updatePayload.statusId = newStatusId;
            updatePayload.logs = arrayUnion(newLogEntry);
            hasChanges = true;
        } else if (observation) {
             updatePayload.logs = arrayUnion(newLogEntry);
             hasChanges = true;
        }
        
        if (technicalSolution !== undefined && technicalSolution !== currentOrderData.technicalSolution) {
            updatePayload.technicalSolution = technicalSolution;
            hasChanges = true;
        }

        if (attachments !== undefined) {
            updatePayload.attachments = attachments;
            hasChanges = true;
        }

        if (confirmedServiceIds !== undefined) {
            updatePayload.confirmedServiceIds = confirmedServiceIds;
            hasChanges = true;
        }

        if (hasChanges) {
            await updateDoc(serviceOrderDocRef, updatePayload);
        }

        const updatedOrder = await getServiceOrderById(id);

        let emailSent = false;
        let emailErrorMessage: string | undefined;

        if (updatedOrder) {
            const newStatusObjQuery = await getDoc(doc(db, 'statuses', newStatusId));
            const newStatusData = newStatusObjQuery.data();
            const triggersEmail = newStatusData?.triggersEmail;
            
            if (triggersEmail && newStatusId !== oldStatusId) {
                 const client = await getClientById(updatedOrder.clientId);
                 const recipientEmail = client?.email || updatedOrder.collaborator.email;

                 if (recipientEmail) {
                    try {
                        const response = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                serviceOrder: updatedOrder, 
                                client,
                                emailBody: newStatusData?.emailBody
                            }),
                        });
                        const responseData = await response.json();
                        if (!response.ok) {
                            emailErrorMessage = `Falha ao enviar e-mail: ${responseData.message || response.statusText}`;
                        } else {
                            emailSent = true;
                        }
                    } catch (error) {
                        emailErrorMessage = `Erro de rede ao tentar enviar e-mail: ${(error as Error).message}`;
                    }
                 } else {
                    emailErrorMessage = 'Nenhum e-mail de destinatário válido.';
                 }
            }
        }
        
        return { updatedOrder, emailSent, emailErrorMessage };

    } catch (error) {
        console.error("Error updating service order:", error);
        if (error instanceof Error) {
            return { updatedOrder: null, emailSent: false, emailErrorMessage: `Erro ao atualizar OS: ${error.message}` };
        }
        return { updatedOrder: null, emailSent: false, emailErrorMessage: "Ocorreu um erro desconhecido ao atualizar a OS." };
    }
};