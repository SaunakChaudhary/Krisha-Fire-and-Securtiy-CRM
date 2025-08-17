import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Contains { user: {}, role: "Admin" | "Engineer" }
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                method: "GET",
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                setUser({
                    user: data.user,
                    role: data.role, 
                    engineerData: data.engineer || null, 
                });
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Auth fetch failed:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
