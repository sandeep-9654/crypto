import { useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const useQmgrSession = () => {
    const lastActivity = useRef(Date.now());
    const timerRef = useRef(null);

    const resetTimer = useCallback(() => {
        lastActivity.current = Date.now();
    }, []);

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, resetTimer));

        timerRef.current = setInterval(async () => {
            if (Date.now() - lastActivity.current > IDLE_TIMEOUT) {
                try {
                    await api.post('/auth/admin/logout-qmgr');
                } catch { }
                window.location.href = '/admin/login';
            }
        }, 30000); // Check every 30 seconds

        return () => {
            events.forEach(evt => window.removeEventListener(evt, resetTimer));
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [resetTimer]);

    return { resetTimer };
};

export default useQmgrSession;
