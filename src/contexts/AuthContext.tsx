import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any;
    login: (user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('vk_auth') === 'true'
    );
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('vk_user') || 'null'); } catch { return null; }
    });

    const login = (userData: any) => {
        localStorage.setItem('vk_auth', 'true');
        localStorage.setItem('vk_user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('vk_auth');
        localStorage.removeItem('vk_user');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
