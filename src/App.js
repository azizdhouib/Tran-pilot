import React, { useState, useEffect } from 'react';
import Chauffeurs from './components/Chauffeurs';
import Vehicules from './components/Vehicules';
import Affectations from './components/Affectations';
import ChauffeurProfil from './components/ChauffeurProfil';
import Amandes from './components/Amandes';
import Sidebar from './components/Sidebar';
import Paiements from './components/Paiements';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import 'leaflet/dist/leaflet.css';

const SUPABASE_BACKGROUND_IMAGE_URL = 'https://itywlbigsmahjxekhrcw.supabase.co/storage/v1/object/public/chauffeur-media/photo_couverture/3409297.jpg';

function App() {
    const [currentPage, setCurrentPage] = useState('chauffeurs');
    const [selectedChauffeurId, setSelectedChauffeurId] = useState(null);
    const [session, setSession] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Gère l'ouverture mobile de la sidebar

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    function retourListe() {
        setSelectedChauffeurId(null);
    }

    const renderContent = () => {
        if (currentPage === 'vehicules') return <Vehicules />;
        if (currentPage === 'affectations') return <Affectations />;
        if (currentPage === 'amandes') return <Amandes />;
        if (currentPage === 'paiements') return <Paiements />;
        if (currentPage === 'chauffeurs' && selectedChauffeurId)
            return <ChauffeurProfil chauffeurId={selectedChauffeurId} retour={retourListe} />;
        return <Chauffeurs onSelectChauffeur={setSelectedChauffeurId} />;
    };

    return !session ? (
        <Auth />
    ) : (
        <div
            className="flex min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${SUPABASE_BACKGROUND_IMAGE_URL})` }}
        >
            <Sidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <main
                className={`flex-1 p-4 md:p-6 overflow-y-auto transition-all duration-300 ${
                    isSidebarOpen ? 'md:ml-48' : ''
                }`}
            >
                <div className="bg-gray-900 bg-opacity-80 p-4 md:p-6 rounded-lg shadow-lg min-h-full text-black">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;
