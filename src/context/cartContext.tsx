'use client';

import { createContext, useReducer, useCallback, useEffect } from 'react';
import { ItemWithInventory } from '@/data/inventory.type';
import { CreateBorrowRequest } from '@/data/borrow.type';

export type CartItem = {
    item: ItemWithInventory;
    quantity: number;
    lecturer?: string;
    subject?: string;
    notes?: string;
    dueDate: string;
};

type CartState = {
    items: CartItem[];
};

type CartAction =
    | { type: 'ADD_TO_CART'; payload: CartItem }
    | { type: 'REMOVE_FROM_CART'; payload: string }
    | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
    | { type: 'UPDATE_CART_ITEM'; payload: { itemId: string; updates: Partial<CartItem> } }
    | { type: 'CLEAR_CART' }
    | { type: 'INITIALIZE_CART'; payload: CartItem[] };

type CartContextType = {
    state: CartState;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
    clearCart: () => void;
    createBorrowRequests: () => CreateBorrowRequest[];
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const existingItem = state.items.find((item) => item.item.$id === action.payload.item.$id);
            if (existingItem) {
                return {
                    ...state,
                    items: state.items.map((item) =>
                        item.item.$id === action.payload.item.$id
                            ? { ...item, quantity: item.quantity + action.payload.quantity }
                            : item
                    ),
                };
            }
            return { ...state, items: [...state.items, action.payload] };
        }
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                items: state.items.filter((item) => item.item.$id !== action.payload),
            };
        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: state.items.map((item) =>
                    item.item.$id === action.payload.itemId ? { ...item, quantity: action.payload.quantity } : item
                ),
            };
        case 'UPDATE_CART_ITEM':
            return {
                ...state,
                items: state.items.map((item) =>
                    item.item.$id === action.payload.itemId ? { ...item, ...action.payload.updates } : item
                ),
            };
        case 'CLEAR_CART':
            return { ...state, items: [] };
        case 'INITIALIZE_CART':
            return { ...state, items: action.payload };
        default:
            return state;
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [] });

    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            dispatch({ type: 'INITIALIZE_CART', payload: JSON.parse(storedCart) });
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(state.items));
    }, [state.items]);

    const addToCart = useCallback((item: CartItem) => {
        dispatch({ type: 'ADD_TO_CART', payload: item });
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
    }, []);

    const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
        dispatch({ type: 'UPDATE_CART_ITEM', payload: { itemId, updates } });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    const createBorrowRequests = useCallback((): CreateBorrowRequest[] => {
        return state.items.map((item) => ({
            item_ids: [item.item.$id],
            item_quantities: [item.quantity],
            dueDate: item.dueDate,
            lecturer: item.lecturer,
            subject: item.subject,
            notes: item.notes,
        }));
    }, [state.items]);

    const value = {
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItem,
        clearCart,
        createBorrowRequests,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
