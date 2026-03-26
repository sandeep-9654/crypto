import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor — attach Bearer token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const qmgrToken = localStorage.getItem('qmgr_token');
    if (qmgrToken) {
        config.headers['x-qmgr-token'] = qmgrToken;
    }
    return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401 && data.error === 'TOKEN_EXPIRED') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('qmgr_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
