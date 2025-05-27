import React, { useState } from 'react';
import Chauffeurs from './components/Chauffeurs';
import Vehicules from './components/Vehicules';
import Affectations from './components/Affectations';
import ChauffeurProfil from './components/ChauffeurProfil';
import Amandes from './components/Amandes'; // Import the Amandes component
import Sidebar from './components/Sidebar';

function App() {
    const [currentPage, setCurrentPage] = useState('chauffeurs');
    const [selectedChauffeurId, setSelectedChauffeurId] = useState(null);

    function retourListe() {
        setSelectedChauffeurId(null);
    }

    let ComponentToRender = () => null; // Renamed from 'Component' to avoid conflict with React.Component
    if (currentPage === 'vehicules') {
        ComponentToRender = Vehicules;
    } else if (currentPage === 'affectations') {
        ComponentToRender = Affectations;
    } else if (currentPage === 'amandes') { // Add this condition for the Amandes page
        ComponentToRender = Amandes;
    } else if (currentPage === 'chauffeurs' && selectedChauffeurId) {
        ComponentToRender = () => <ChauffeurProfil chauffeurId={selectedChauffeurId} retour={retourListe} />;
    } else if (currentPage === 'chauffeurs') {
        ComponentToRender = () => <Chauffeurs onSelectChauffeur={setSelectedChauffeurId} />;
    }

    return (
        <div className="flex">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="flex-1 p-6 bg-gray-100 min-h-screen">
                <ComponentToRender /> {/* Use the renamed variable here */}
            </main>
        </div>
    );
}

export default App;