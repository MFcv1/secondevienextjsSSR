import React from 'react';

const MarketplaceDiscovery = ({ isOpen, onClose, onExplore }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50">
            <div className="bg-white p-8 rounded-xl text-center">
                <h2 className="text-2xl mb-4">Marketplace Discovery</h2>
                <button onClick={onExplore} className="px-4 py-2 bg-black text-white rounded">Explorer</button>
                <button onClick={onClose} className="px-4 py-2 ml-4 border rounded">Fermer</button>
            </div>
        </div>
    );
};

export default MarketplaceDiscovery;
