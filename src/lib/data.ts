"use client"
import { ServiceOrder, ServiceOrderStatus, User, Client, LogEntry, Role, Permissions } from "./types";
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
    const clientMap = new Map<string, string>();
    clients.forEach(client => {
        clientMap.set(client.id, client.name);
    });

    // 2. Fetch all service orders
    const serviceOrdersCollection = collection(db, "serviceOrders");
    const q = query(serviceOrdersCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    // 3. Map orders and efficiently look up client names from the map
    const serviceOrdersData = querySnapshot.docs.map(doc => {
        const order = {
            ...doc.data(),
            id: doc.id,
        } as ServiceOrder;

        return {
            ...order,
            clientName: clientMap.get(order.clientId) || 'Cliente não encontrado',
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
            // Ensure createdAt and log timestamps are Date objects
            createdAt: orderData.createdAt instanceof Date ? orderData.createdAt : (orderData.createdAt as any).toDate(),
            logs: orderData.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })),
            attachments: orderData.attachments || [] // Ensure attachments is an empty array if undefined
        } as ServiceOrder;
    }

    return null;
};

export const addServiceOrder = async (
    data: Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'logs' | 'status' | 'attachments'>
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
  
    // Agora sim, roda a transação normalmente
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
        attachments: [] // Initialize attachments as an empty array
      };
  
      const newServiceOrderRef = doc(serviceOrdersCollection);
      tx.set(newServiceOrderRef, newOrderData);
  
      return { ...newOrderData, id: newServiceOrderRef.id };
    });
  
    return newOrder;
  };

export const updateServiceOrder = async (id: string, newStatus: ServiceOrderStatus, responsible: string, technicalSolution?: string, observation?: string, attachments?: string[]) => {
    const serviceOrderDocRef = doc(db, "serviceOrders", id);
    
    const currentOrderSnap = await getDoc(serviceOrderDocRef);
    if (!currentOrderSnap.exists()) return null;

    const currentOrderData = currentOrderSnap.data() as ServiceOrder;
    const oldStatus = currentOrderData.status;

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

    await updateDoc(serviceOrderDocRef, updatePayload);

    // Fetch the updated document to return the full object with clientName
    const updatedServiceOrderSnap = await getDoc(serviceOrderDocRef);
    if (updatedServiceOrderSnap.exists()) {
        const updatedOrderData = updatedServiceOrderSnap.data() as ServiceOrder;
        const client = await getClientById(updatedOrderData.clientId);
        return {
            ...updatedOrderData, 
            id: updatedServiceOrderSnap.id,
            clientName: client ? client.name : 'Cliente não encontrado',
            // Ensure createdAt and log timestamps are Date objects
            createdAt: updatedOrderData.createdAt instanceof Date ? updatedOrderData.createdAt : (updatedOrderData.createdAt as any).toDate(),
            logs: updatedOrderData.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            })),
            attachments: updatedOrderData.attachments || [] // Ensure attachments is an empty array if undefined
        } as ServiceOrder;
    }

    return null;
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