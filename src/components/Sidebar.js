import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage }) {
    const links = [
        { label: 'Chauffeurs', key: 'chauffeurs' },
        { label: 'Véhicules', key: 'vehicules' },
        { label: 'Affectations', key: 'affectations' },
        { label: 'Amandes', key: 'amandes' }, // <-- Add this line
    ];

    return (
        <div className="w-48 min-h-screen bg-gray-800 text-white p-4">
            <h2 className="text-lg font-bold mb-6">TransPilot</h2>
            <ul>
                {links.map((link) => (
                    <li
                        key={link.key}
                        className={`cursor-pointer py-2 px-3 rounded hover:bg-gray-700 ${currentPage === link.key ? 'bg-gray-700' : ''}`}
                        onClick={() => setCurrentPage(link.key)}
                    >
                        {link.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}