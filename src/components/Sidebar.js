import React, { useState } from 'react'; // Import useState

export default function Sidebar({ currentPage, setCurrentPage }) {
    // State to control sidebar visibility on smaller screens
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const links = [
        { label: 'Chauffeurs', key: 'chauffeurs' },
        { label: 'Véhicules', key: 'vehicules' },
        { label: 'Affectations', key: 'affectations' },
        { label: 'Amendes', key: 'amandes' },
    ];

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
                // Initial width for larger screens (md:w-48)
                // Hidden by default on small screens (hidden)
                // Visible and fixed when open on small screens (isSidebarOpen ? 'translate-x-0' : '-translate-x-full')
                className={`
                    w-48 min-h-screen bg-gray-800 text-white p-4
                    fixed inset-y-0 left-0 z-50
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 md:flex md:flex-col
                `}
            >
                <h2 className="text-lg font-bold mb-6">TransPilot</h2>
                <ul>
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
            </div>
        </>
    );
}