'use server';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { app } from "./firebase";

type ActionType = 
    | 'INICIO DE SESIÓN' 
    | 'CIERRE DE SESIÓN' 
    | 'CREAR USUARIO' 
    | 'ACTUALIZAR USUARIO'
    | 'CREAR CLIENTE'
    | 'ACTUALIZAR CLIENTE'
    | 'CREAR CRÉDITO'
    | 'APLICAR ABONO'
    | 'CREAR REFERENCIA'
    | 'ACTUALIZAR REFERENCIA'
    | 'CREAR GARANTIA'
    | 'ASIGNAR RUTA';

export const logAction = async (action: ActionType, details: string, userId: string) => {
    try {
        const db = getFirestore(app);
        
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        let userEmail = 'Desconocido';
        let userRole = 'Desconocido';

        if (userDocSnap.exists()) {
            userEmail = userDocSnap.data().email;
            userRole = userDocSnap.data().role;
        }

        const logData = {
            action,
            details,
            user: userEmail,
            userId,
            role: userRole,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, "action_logs"), logData);
    } catch (error) {
        console.error("Error logging action: ", error);
        // Silently fail to not interrupt user flow
    }
};

      