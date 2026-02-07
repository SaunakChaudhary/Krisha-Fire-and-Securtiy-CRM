import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("role");
                localStorage.removeItem("engineerData");
                setUser(null);
            } else {
                const data = await res.json();
                const userData = {
                    user: data.user,
                    role: data.role,
                    engineerData: data.engineerData || null,
                };

                localStorage.setItem("user", JSON.stringify(userData.user));
                localStorage.setItem("role", userData.role);
                localStorage.setItem(
                    "engineerData",
                    JSON.stringify(userData.engineerData)
                );
                setUser(userData);
            }
        } catch (err) {
            console.error("Auth fetch error:", err);
        }

        setLoading(false);
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
