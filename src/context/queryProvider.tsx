'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

export default function QueryProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const useQueryClientSafe = () => {
    const context = useQueryClient();
    if (context === undefined) {
        throw new Error('useQueryClientSafe must be used within a QueryClientProvider');
    }
    return context;
};
