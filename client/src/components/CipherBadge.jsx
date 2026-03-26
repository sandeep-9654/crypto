import React from 'react';

const CipherBadge = ({ type }) => (
    <span className={`cipher-badge ${type}`}>{type}</span>
);

export default CipherBadge;
