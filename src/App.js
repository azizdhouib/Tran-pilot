import React, { useState, useEffect } from 'react'; // Import useEffect
import Chauffeurs from './components/Chauffeurs';
import Vehicules from './components/Vehicules';
import Affectations from './components/Affectations';
import ChauffeurProfil from './components/ChauffeurProfil';
import Amandes from './components/Amandes';
import Sidebar from './components/Sidebar';
import Paiements from './components/Paiements';
import Auth from './components/Auth'; // Import the Auth component
import { supabase } from './supabaseClient'; // Import your Supabase client

// --- IMPORTANT: Replace [your-project-ref] with your actual Supabase project ID ---
const SUPABASE_BACKGROUND_IMAGE_URL = 'https://itywlbigsmahjxekhrcw.supabase.co/storage/v1/object/public/chauffeur-media/photo_couverture/3409297.jpg';


function App() {
    const [currentPage, setCurrentPage] = useState('chauffeurs');
    const [selectedChauffeurId, setSelectedChauffeurId] = useState(null);
    const [session, setSession] = useState(null); // New state to store the user session

    // Listen for authentication state changes
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

    // Determine which component to render based on currentPage and selectedChauffeurId
    const renderContent = () => {
        if (currentPage === 'vehicules') {
            return <Vehicules />;
        } else if (currentPage === 'affectations') {
            return <Affectations />;
        } else if (currentPage === 'amandes') {
            return <Amandes />;
        } else if (currentPage === 'chauffeurs' && selectedChauffeurId) {
            return <ChauffeurProfil chauffeurId={selectedChauffeurId} retour={retourListe} />;
        } else if (currentPage === 'chauffeurs') {
            return <Chauffeurs onSelectChauffeur={setSelectedChauffeurId} />;
        } else if (currentPage === 'paiements') {
            return <Paiements />;
        }
        // Fallback for any unhandled currentPage values
        return <Chauffeurs onSelectChauffeur={setSelectedChauffeurId} />;
    };

    return (
        // Conditional rendering based on session
        !session ? (
            <Auth /> // Render Auth component if no session
        ) : (
            <div
                className="flex min-h-screen bg-cover bg-center"
                style={{ backgroundImage: `url(${SUPABASE_BACKGROUND_IMAGE_URL})` }}
            >
                <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-gray-900 bg-opacity-80 p-4 md:p-6 rounded-lg shadow-lg min-h-full text-black">
                        {renderContent()}
                    </div>
                </main>
            </div>
        )
    );
}

export default App;