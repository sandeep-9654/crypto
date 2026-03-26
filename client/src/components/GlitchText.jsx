import React from 'react';

const GlitchText = ({ text, className = '', tag: Tag = 'h1' }) => (
    <Tag className={`glitch-text ${className}`} data-text={text}>
        {text}
    </Tag>
);

export default GlitchText;
