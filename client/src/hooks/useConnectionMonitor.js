import { useEffect, useState, useCallback } from 'react';

const useConnectionMonitor = (teamId, socket) => {
    const [isOffline, setIsOffline] = useState(false);
    const [graceExpired, setGraceExpired] = useState(false);

    const handleOffline = useCallback(() => {
        if (!teamId) return;
        setIsOffline(true);
        if (socket && socket.connected) {
            socket.emit('client:connectivity_lost', { teamId });
        }
    }, [teamId, socket]);

    const handleOnline = useCallback(() => {
        setIsOffline(false);
        if (socket) {
            socket.emit('client:connectivity_restored', { teamId });
        }
    }, [teamId, socket]);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const onSocketDisconnect = () => {
            if (navigator.onLine) return;
            handleOffline();
        };
        const onSocketConnect = () => {
            if (isOffline) handleOnline();
        };

        if (socket) {
            socket.on('disconnect', onSocketDisconnect);
            socket.on('connect', onSocketConnect);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (socket) {
                socket.off('disconnect', onSocketDisconnect);
                socket.off('connect', onSocketConnect);
            }
        };
    }, [handleOnline, handleOffline, socket, isOffline]);

    const onGraceExpired = () => setGraceExpired(true);

    return { isOffline, graceExpired, onGraceExpired };
};

export default useConnectionMonitor;
