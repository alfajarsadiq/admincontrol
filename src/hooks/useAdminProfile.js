// File: src/hooks/useAdminProfile.js

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

export const useAdminProfile = () => {
    const [profile, setProfile] = useState({ name: 'Admin', companyName: 'Ferrari Mail', logo: '' });
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await axios.get(API_URL);
            // Prepend the server URL to the logo path
            response.data.logo = `http://localhost:5000${response.data.logo}`;
            setProfile(response.data);
        } catch (error) {
            console.error("Failed to fetch admin profile:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, refreshProfile: fetchProfile };
};