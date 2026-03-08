import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, query } from '@react-native-firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDb } from '../firebase';
import { useAuth } from './AuthContext';

export type Product = {
    id: string;
    name: string;
    price: number;
    category: string;
};

type ProductContextType = {
    products: Record<string, Product[]>;
    categories: string[];
    loading: boolean;
};


const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, parttimeId } = useAuth();
    const [products, setProducts] = useState<Record<string, Product[]>>({});
    const [loading, setLoading] = useState(true);

    const PRODUCTS_CACHE_KEY = parttimeId ? `products_cache_${parttimeId}` : 'products_cache_global';

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        if (user && parttimeId) {
            loadProductsWithCache().then((unsub) => {
                unsubscribe = unsub;
            });
        } else {
            setProducts({});
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, parttimeId]);

    // Load from cache first, then Firestore
    const loadProductsWithCache = async () => {
        if (!user || !parttimeId) {
            setProducts({});
            setLoading(false);
            return;
        }

        setLoading(true);
        // Try to load from cache (per-user)
        try {
            const cached = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
            if (cached) {
                setProducts(JSON.parse(cached));
                setLoading(false);
            }
        } catch (e) {
            // Ignore cache errors
        }
        // Always listen to Firestore for updates
        return loadProductsFromFirestore();
    };

    const loadProductsFromFirestore = () => {
        if (!user || !parttimeId) return () => { };

        const db = getDb();
        // Products belong to the specific parttime
        const q = query(
            collection(db, 'parttimes', parttimeId, 'products'),
        );
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const productsData: Record<string, Product[]> = {};
            querySnapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() } as Product;
                if (!productsData[product.category]) {
                    productsData[product.category] = [];
                }
                productsData[product.category].push(product);
            });
            setProducts(productsData);
            // Update cache
            try {
                await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(productsData));
            } catch (e) { }
            setLoading(false);
        });
        return unsubscribe;
    };



    const categories = Object.keys(products);

    return (
        <ProductContext.Provider value={{ products, categories, loading }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) throw new Error('useProducts must be used within ProductProvider');
    return context;
};
