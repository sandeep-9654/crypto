import { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const useApprovalPolling = (enabled = true) => {
    const [status, setStatus] = useState(null);
    const [rejectionReason, setRejectionReason] = useState(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const poll = async () => {
            try {
                const res = await api.get('/auth/approval-status');
                setStatus(res.data.approvalStatus);
                setRejectionReason(res.data.rejectionReason);
            } catch { }
        };

        poll();
        intervalRef.current = setInterval(poll, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled]);

    return { status, rejectionReason };
};

export default useApprovalPolling;
