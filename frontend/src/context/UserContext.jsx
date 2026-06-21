import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../config';
import DefaultPfp from '../Assets/icons/default-pfp.png';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('login_user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) { setLoading(false); return; }

        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { setLoading(false); return; }

            const data = await res.json();

            // University accounts: resolve the page avatar + display name
            if ((data.role === 'uni' || localStorage.getItem('user_type') === 'university') && data.id) {
                const pageRes = await fetch(`${API}/api/pages/${data.id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (pageRes.ok) {
                    const pageData = await pageRes.json();
                    data.avatar = pageData.profile_image;
                }
                data.username = data.page_full_name || data.page_name || data.username;
            }

            setUser(data);
            localStorage.setItem('login_user', JSON.stringify(data));
        } catch (e) {
            console.error('[UserContext] Failed to fetch user:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch once on mount (only if a token exists)
    useEffect(() => { fetchUser(); }, [fetchUser]);

    // Derived avatar URL — ready to drop straight into <img src={avatarSrc}>
    const rawAvatar = user?.profile?.avatar || user?.avatar || user?.profile_image;
    const avatarSrc = rawAvatar
        ? (rawAvatar.startsWith('http') ? rawAvatar : `${API}${rawAvatar}`)
        : DefaultPfp;

    return (
        <UserContext.Provider value={{ user, setUser, avatarSrc, loading, refreshUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
    return ctx;
}
