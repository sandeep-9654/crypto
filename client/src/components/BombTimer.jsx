import React, { useState, useEffect } from 'react';

const BombTimer = ({ timeLimitSeconds, startTime }) => {
    const [remaining, setRemaining] = useState(timeLimitSeconds);

    useEffect(() => {
        if (!startTime) { setRemaining(timeLimitSeconds); return; }
        const start = new Date(startTime).getTime();

        const tick = () => {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const left = Math.max(0, timeLimitSeconds - elapsed);
            setRemaining(left);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [timeLimitSeconds, startTime]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const isCritical = remaining <= 60;

    return (
        <div className={`bomb-timer ${isCritical ? 'critical' : 'text-neon-green'}`}>
            <span className="text-sm block mb-1 opacity-60">⏱ TIME REMAINING</span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
};

export default BombTimer;
