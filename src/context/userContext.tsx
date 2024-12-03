'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getUser } from '@/actions/auth';
import { User } from '@/data/user.type';

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    refresh: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const response = await getUser();
            if (response.success && response.data) {
                setUser(response.data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                isLoading,
                refresh,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export { UserContext };
