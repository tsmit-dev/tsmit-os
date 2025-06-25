// @ts-nocheck
"use client"
import { ServiceOrder, ServiceOrderStatus, User, UserRole, Client, LogEntry } from "./types";
import { db, auth } from "./firebase"; 
import { collection, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, runTransaction, arrayUnion, setDoc, addDoc } from "firebase/firestore"; 
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase Functions

// Initialize Firebase Functions
const functions = getFunctions();

// Callable Cloud Functions
const createUserCloudFunction = httpsCallable(functions, "createUser");
const deleteUserCloudFunction = httpsCallable(functions, "deleteUser");

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const docData = doc.data() as User & { password?: string };
        const { password, ...userData } = docData; // Exclude password
        return { ...userData, id: doc.id } as User;
    });
};

export const getUserById = async (id: string): Promise<User | null> => {
    const userDocRef = doc(db, "users", id);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
        const docData = userSnap.data() as User & { password?: string };
        const { password, ...userData } = docData; // Exclude password
        return { ...userData, id: userSnap.id } as User;
    }

    return null;
};

export type UserData = {
    name: string;
    email: string;
    role: UserRole;
};

// No longer directly adding user data via this client-side function.
// The Cloud Function will handle both Auth and Firestore parts.
// export const addUser = async (data: UserData, uid: string): Promise<User> => { ... };

export const registerUser = async (data: Omit<UserData, 'password'>, password: string): Promise<User> => {
    console.log(`[data.ts] registerUser: Attempting to create user via Cloud Function for email: ${data.email}`);
    try {
        const result = await createUserCloudFunction({ ...data, password });
        const { success, message, userId } = result.data as any; // Cast to any for now

        if (!success) {
            throw new Error(message || "Failed to create user via Cloud Function.");
        }

        console.log(`[data.ts] registerUser: User created successfully via Cloud Function. UID: ${userId}`);
        return { ...data, id: userId } as User; // Return a User object based on the new UID
    } catch (error: any) {
        console.error(`[data.ts] registerUser: Error calling createUser Cloud Function for email ${data.email}:`, error);
        // Rethrow the HttpsError message or a generic error
        throw new Error(error.message || "Ocorreu um erro desconhecido durante o registro.");
    }
};

export const updateUser = async (id: string, data: Partial<UserData>): Promise<User | null> => {
    const userDocRef = doc(db, "users", id);
    await updateDoc(userDocRef, data);

    const updatedSnap = await getDoc(userDocRef);
    if (updatedSnap.exists()) {
        const docData = updatedSnap.data() as User & { password?: string };
        const { password, ...updatedUserData } = docData;
        return { ...updatedUserData, id: updatedSnap.id } as User;
    }
    return null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
    console.log(`[data.ts] deleteUser: Attempting to delete user via Cloud Function for UID: ${id}`);
    try {
        const result = await deleteUserCloudFunction({ uid: id });
        const { success, message } = result.data as any; // Cast to any for now

        if (!success) {
            throw new Error(message || "Failed to delete user via Cloud Function.");
        }
        console.log(`[data.ts] deleteUser: User deleted successfully via Cloud Function.`);
        return true;
    } catch (error: any) {
        console.error("Error calling deleteUser Cloud Function:", error);
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
            }))
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
            ...orderData, // Spread data first
            id: serviceOrderSnap.id,
            clientName: client ? client.name : 'Cliente não encontrado',
            // Ensure createdAt and log timestamps are Date objects
            createdAt: orderData.createdAt instanceof Date ? orderData.createdAt : (orderData.createdAt as any).toDate(),
            logs: orderData.logs.map(log => ({
                ...log,
                timestamp: log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate(),
            }))
        } as ServiceOrder;
    }

    return null;
};

export const addServiceOrder = async (
    data: Omit<ServiceOrder, 'id' | 'orderNumber' | 'createdAt' | 'logs' | 'status'>
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
        ]
      };
  
      const newServiceOrderRef = doc(serviceOrdersCollection);
      tx.set(newServiceOrderRef, newOrderData);
  
      return { ...newOrderData, id: newServiceOrderRef.id };
    });
  
    return newOrder;
  };

export const updateServiceOrder = async (id: string, newStatus: ServiceOrderStatus, responsible: string, technicalSolution?: string, observation?: string) => {
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
            }))
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
