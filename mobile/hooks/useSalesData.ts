import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase';
import { useAnalytics } from './useAnalytics';

export type TransactionItem = {
    id: string;
    productName: string;
    category: string;
    price: number;
    quantity: number;
};

export type Transaction = {
    id: string;
    date: string; // YYYY-MM-DD
    timestamp: number;
    items: TransactionItem[];
    totalAmount: number;
    paymentMethod: 'cash' | 'card' | 'upi';
    tip: number;
    userId?: string;
    userName?: string;
    // Legacy fields for backward compatibility (optional)
    productName?: string;
    category?: string;
    price?: number;
    quantity?: number;
};

export const useSalesData = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [cart, setCart] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, parttimeId } = useAuth();
    const { logTransactionAdded, logProductSold } = useAnalytics();

    useEffect(() => {
        if (!user || !parttimeId) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const db = getDb();

        // Filter by the current user to prevent data leaks.
        // We use client-side sorting to avoid requiring a composite index right away.
        const q = query(
            collection(db, 'parttimes', parttimeId, 'transactions'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot) {
                setTransactions([]);
                setLoading(false);
                return;
            }
            const seen = new Set<string>();
            const transactionsData: Transaction[] = [];
            querySnapshot.forEach((doc) => {
                if (seen.has(doc.id)) return;
                seen.add(doc.id);
                transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
            });
            transactionsData.sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(transactionsData);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [user, parttimeId]);

    const addToCart = (item: Omit<TransactionItem, 'id'>) => {
        setCart(prev => {
            const existingItemIndex = prev.findIndex(i => i.productName === item.productName);
            if (existingItemIndex >= 0) {
                const updatedCart = [...prev];
                const existingItem = updatedCart[existingItemIndex];
                updatedCart[existingItemIndex] = {
                    ...existingItem,
                    quantity: existingItem.quantity + item.quantity,
                    // Optionally update price if it changed, currently assuming same price for same product name
                };
                return updatedCart;
            }
            const newItem = { ...item, id: Date.now().toString() };
            return [...prev, newItem];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const updateCartItemQty = (itemId: string, delta: number) => {
        setCart(prev => {
            const idx = prev.findIndex(i => i.id === itemId);
            if (idx < 0) return prev;
            const updated = [...prev];
            const newQty = updated[idx].quantity + delta;
            if (newQty <= 0) {
                // remove item if qty hits 0
                return updated.filter(i => i.id !== itemId);
            }
            updated[idx] = { ...updated[idx], quantity: newQty };
            return updated;
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp'>) => {
        if (!user || !parttimeId) return;

        const newTransaction: Omit<Transaction, 'id'> = {
            ...transactionData,
            timestamp: Date.now(),
            userId: user.uid,
            userName: user.displayName || undefined,
        };

        const db = getDb();
        const docRef = await addDoc(collection(db, 'parttimes', parttimeId, 'transactions'), newTransaction);

        // Optimistically update local state so UI reflects the new sale immediately
        setTransactions(prev => {
            if (prev.some(t => t.id === docRef.id)) return prev;
            return [{ id: docRef.id, ...newTransaction }, ...prev];
        });

        clearCart(); // Clear cart after successful transaction

        // Log analytics
        await logTransactionAdded(transactionData.totalAmount, transactionData.paymentMethod);
        for (const item of transactionData.items) {
            await logProductSold(item.productName, user.uid, item.price * item.quantity);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!parttimeId) return;
        const db = getDb();
        await deleteDoc(doc(db, 'parttimes', parttimeId, 'transactions', id));
    };

    const updateTransaction = async (updatedTransaction: Transaction) => {
        const { id, ...data } = updatedTransaction;
        if (!parttimeId) return;
        const db = getDb();
        await updateDoc(doc(db, 'parttimes', parttimeId, 'transactions', id), data);
    };

    return {
        transactions,
        loading,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart
    };
};
