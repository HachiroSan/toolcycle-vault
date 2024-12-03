import { ReactNode } from 'react';
import { UserProvider } from './userContext';
import { CartProvider } from './cartContext';
import QueryProvider from './queryProvider';

interface ContextProviderProps {
    children: ReactNode;
}

export function ContextProvider({ children }: ContextProviderProps) {
    return (
        <QueryProvider>
            <UserProvider>
                <CartProvider>{children}</CartProvider>
            </UserProvider>
        </QueryProvider>
    );
}
