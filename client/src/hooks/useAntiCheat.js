import { useEffect, useRef, useState, useCallback } from 'react';

const useAntiCheat = (teamId, socket) => {
    const [violationCount, setViolationCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const countRef = useRef(0);

    const handleViolation = useCallback(() => {
        if (isLocked || !teamId) return;

        countRef.current += 1;
        const count = countRef.current;
        setViolationCount(count);

        if (socket) {
            socket.emit('client:tab_switch', { teamId, violationCount: count });
        }

        if (count >= 3) {
            setIsLocked(true);
            if (socket) {
                socket.emit('client:lockout_trigger', { teamId, reason: 'TAB_SWITCH', violationCount: count });
            }
        } else {
            setShowWarning(true);
        }
    }, [teamId, socket, isLocked]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) handleViolation();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleViolation]);

    const acknowledgeWarning = () => setShowWarning(false);

    return { violationCount, showWarning, isLocked, acknowledgeWarning };
};

export default useAntiCheat;
