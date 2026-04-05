import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                // JWT dùng base64url (có `-` và `_`), atob() cần base64 chúan
                const base64Payload = storedToken.split('.')[1]
                    .replace(/-/g, '+').replace(/_/g, '/');
                const payloadStr = atob(base64Payload);
                const payload = JSON.parse(payloadStr);

                // Check expiration
                if (payload.exp * 1000 < Date.now()) {
                    logout();
                    return;
                }

                // If token valid but user not in localStorage, fallback to token data
                if (!localStorage.getItem('user')) {
                    setUser({
                        email: payload.sub,
                        roles: payload.roles || []
                    });
                }
            } catch (error) {
                console.error("Failed to decode token", error);
                logout();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const loginUser = (authData) => {
        setToken(authData.accessToken);
        const userInfo = {
            id: authData.userId,
            email: authData.email,
            fullName: authData.fullName,
            roles: authData.roles
        };
        setUser(userInfo);
        localStorage.setItem('token', authData.accessToken);
        localStorage.setItem('user', JSON.stringify(userInfo));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login: loginUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);