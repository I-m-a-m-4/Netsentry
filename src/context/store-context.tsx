'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { Student, Subject, SyllabusItem, Academy, Admission, StudentProfile, MentorshipBooking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, limit, or, getDoc, and } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { secureStorage } from '@/lib/secure-storage';

interface StoreContextType {
  academy: Academy | null;
  subjects: Subject[] | null;
  isLoading: boolean;
  syllabus: SyllabusItem[];
  addToCart: (product: Subject) => void;
  removeFromCart: (subjectId: string) => void;
  updateQuantity: (subjectId: string, quantity: number) => void;
  clearCart: () => void;
  onOrderPlaced: () => void;
  searchProducts: (term: string) => Promise<Subject[]>;
  subtotal: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'zeneva-store-syllabus';

export function StoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const params = useParams();
  const businessIdOrSlug = params.academyId as string;

  const [academy, setBusiness] = useState<Academy | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  
  const [syllabus, setCart] = useState<SyllabusItem[]>([]);

  useEffect(() => {
    // Load syllabus from secureStorage on initial render
    const storedCart = secureStorage.getItem<SyllabusItem[]>(CART_STORAGE_KEY);
    if (storedCart) {
        setCart(storedCart);
    }
  }, []);

  useEffect(() => {
    // Save syllabus to secureStorage whenever it changes
    secureStorage.setItem(CART_STORAGE_KEY, syllabus);
  }, [syllabus]);


  useEffect(() => {
    if (!firestore || !businessIdOrSlug) {
        setBusinessLoading(false);
        return;
    }

    const findBusiness = async () => {
        setBusinessLoading(true);
        try {
            let foundBusiness: Academy | null = null;
            const academyCollection = collection(firestore, 'businessInstances');
            
            const q = query(academyCollection, where('settings.publicStore.slug', '==', businessIdOrSlug), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const businessDoc = querySnapshot.docs[0];
                const businessData = { id: businessDoc.id, ...businessDoc.data() } as Academy;
                if (businessData.settings?.publicStore?.enabled) {
                    foundBusiness = businessData;
                }
            } else {
                const docRef = doc(firestore, 'businessInstances', businessIdOrSlug);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const businessData = { id: docSnap.id, ...docSnap.data() } as Academy;
                    if (businessData.settings?.publicStore?.enabled) {
                       foundBusiness = businessData;
                   }
                }
            }
            setBusiness(foundBusiness);
        } catch (error) {
            console.error("Error finding academy:", error);
        } finally {
            setBusinessLoading(false);
        }
    };

    findBusiness();
  }, [firestore, businessIdOrSlug]);

  const subjectsQuery = useMemoFirebase(() => (academy?.id ? query(collection(firestore, "subjects"), where("academyId", "==", academy.id), limit(24)) : null), [academy?.id, firestore]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const searchProducts = useCallback(async (term: string) => {
    if (!academy?.id || !term.trim()) return [];
    try {
        const q = query(
            collection(firestore, "subjects"),
            and(
                where("academyId", "==", academy.id),
                or(
                    where("name", ">=", term),
                    where("name", "<=", term + '\uf8ff')
                )
            ),
            limit(24)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as Subject));
    } catch (e) {
        console.error("Store search failed:", e);
        return [];
    }
  }, [academy?.id, firestore]);

  const isLoading = businessLoading || isLoadingSubjects;

  const addToCart = (product: Subject) => {
    setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= (product.stock || 0)) {
                toast({ title: 'Stock limit reached', variant: 'warning' });
                return prevCart;
            }
            return prevCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        if ((product.stock || 0) <= 0) {
            toast({ title: 'Out of stock', variant: 'destructive' });
            return prevCart;
        }
        return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (subjectId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== subjectId));
  };
  
  const updateQuantity = (subjectId: string, quantity: number) => {
    const itemInCart = syllabus.find(item => item.product.id === subjectId);
    if (!itemInCart) return;

    if (quantity > (itemInCart.product.stock || 0)) {
        toast({ title: 'Stock limit reached', variant: 'destructive' });
        quantity = itemInCart.product.stock || 0;
    }
    
    if (quantity <= 0) {
        removeFromCart(subjectId);
    } else {
        setCart(prev => prev.map(item => item.product.id === subjectId ? { ...item, quantity } : item));
    }
  };

  const clearCart = () => setCart([]);
  const onOrderPlaced = () => clearCart();

  const subtotal = useMemo(() => syllabus.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [syllabus]);

  const value = useMemo(() => ({
    academy,
    subjects,
    isLoading,
    syllabus,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    onOrderPlaced,
    searchProducts,
    subtotal
  }), [academy, subjects, isLoading, syllabus, searchProducts, subtotal]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
