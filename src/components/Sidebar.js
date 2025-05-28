import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Import supabase

export default function Sidebar({ currentPage, setCurrentPage }) {
    // State to control sidebar visibility on smaller screens
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const links = [
        { label: 'Chauffeurs', key: 'chauffeurs' },
        { label: 'Véhicules', key: 'vehicules' },
        { label: 'Affectations', key: 'affectations' },
        { label: 'Amendes', key: 'amandes' },
        { label: 'Paiements', key: 'paiements' },
    ];

    // Function to handle logout
    async function handleLogout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // The onAuthStateChange listener in App.js should handle state update and redirect
        } catch (error) {
            console.error('Error logging out:', error.message);
            alert('Erreur lors de la déconnexion : ' + error.message);
        }
    }

    return (
        <>
            {/* Hamburger icon for small screens */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 text-white bg-gray-800 rounded-md"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    ></path>
                </svg>
            </button>

            {/* Overlay for when sidebar is open on small screens */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar content */}
            <div
                className={`
                    w-48 min-h-screen bg-gray-800 text-white p-4
                    fixed inset-y-0 left-0 z-50
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 md:flex md:flex-col
                `}
            >
                <h2 className="text-lg font-bold mb-6">TransPilot</h2>
                <ul className="flex-grow"> {/* Use flex-grow to push logout to bottom if needed */}
                    {links.map((link) => (
                        <li
                            key={link.key}
                            className={`cursor-pointer py-2 px-3 rounded hover:bg-gray-700 ${currentPage === link.key ? 'bg-gray-700' : ''}`}
                            onClick={() => {
                                setCurrentPage(link.key);
                                setIsSidebarOpen(false); // Close sidebar on link click
                            }}
                        >
                            {link.label}
                        </li>
                    ))}
                </ul>

                {/* Logout Button with Icon */}
                <div className="mt-auto pt-4 border-t border-gray-700">
                    <li
                        className="cursor-pointer py-2 px-3 rounded hover:bg-red-700 text-red-300 flex items-center" // Added flex items-center for icon alignment
                        onClick={() => {
                            handleLogout();
                            setIsSidebarOpen(false); // Close sidebar on logout click
                        }}
                    >
                        <svg
                            className="w-5 h-5 mr-2" // Added mr-2 for spacing
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-5a3 3 0 013-3h6a3 3 0 013 3v1"
                            ></path>
                        </svg>
                        Déconnexion
                    </li>
                </div>
            </div>
        </>
    );
}