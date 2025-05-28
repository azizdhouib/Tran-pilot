import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ChauffeurProfil from './ChauffeurProfil';
import ChauffeurForm from './ChauffeurForm';

export default function Chauffeurs() {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [chauffeurToEdit, setChauffeurToEdit] = useState(null);
  const [user, setUser] = useState(null); // State to store the current user

  useEffect(() => {
    const initializeData = async () => {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Call fetchChauffeurs only if a user is logged in
        fetchChauffeurs(session.user.id);
      } else {
        console.error("Utilisateur non authentifié. Impossible de charger les chauffeurs.");
        setLoading(false); // Stop loading if no user
      }
    };
    initializeData();
  }, []); // Empty dependency array means this runs once on mount

  async function fetchChauffeurs(userId) {
    if (!userId) { // Ensure userId is available before fetching
      setChauffeurs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Explicitly filter by user_id
      const { data, error } = await supabase
          .from('chauffeurs')
          .select('*')
          .eq('user_id', userId) // Filter by the current user's ID
          .order('created_at', { ascending: false });
      if (error) throw error;
      setChauffeurs(data || []);
    } catch (err) {
      console.error('Error fetching chauffeurs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function supprimerChauffeur(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ? Cette action est irréversible.')) {
      try {
        // RLS should handle deletion permission based on user_id
        const { error } = await supabase
            .from('chauffeurs')
            .delete()
            .eq('id', id);

        if (error) {
          throw error;
        }

        alert('Chauffeur supprimé avec succès!');
        // Refresh the list with the current user's data
        if (user) {
          fetchChauffeurs(user.id);
        }
      } catch (err) {
        console.error('Error deleting chauffeur:', err);
        alert('Erreur lors de la suppression du chauffeur : ' + err.message);
      }
    }
  }

  const handleAddChauffeurClick = () => {
    setChauffeurToEdit(null); // Ensure we're adding, not editing
    setShowAddForm(true);
  };

  const handleEditChauffeur = (chauffeur) => {
    setChauffeurToEdit(chauffeur);
    setShowAddForm(true);
  };

  const handleChauffeurSaved = () => {
    setShowAddForm(false);
    if (user) {
      fetchChauffeurs(user.id); // Refresh list after save
    }
  };

  if (selectedChauffeurId) {
    return <ChauffeurProfil chauffeurId={selectedChauffeurId} retour={() => setSelectedChauffeurId(null)} />;
  }

  return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Gestion des Chauffeurs</h1>

        <div className="mb-6 flex justify-end">
          <button
              onClick={handleAddChauffeurClick}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
          >
            Ajouter un Nouveau Chauffeur
          </button>
        </div>

        {showAddForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
              <ChauffeurForm
                  chauffeur={chauffeurToEdit}
                  onClose={() => setShowAddForm(false)}
                  onSave={handleChauffeurSaved}
                  currentUserId={user ? user.id : null} // Pass user ID to the form
              />
            </div>
        )}

        {loading ? (
            <p className="text-center text-gray-600">Chargement des chauffeurs...</p>
        ) : chauffeurs.length === 0 ? (
            <p className="text-center text-gray-600">Aucun chauffeur trouvé. Ajoutez-en un !</p>
        ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Photo</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Nom Complet</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Téléphone</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {chauffeurs.map((c) => (
                    <tr key={c.id}>
                      <td className="px-2 py-2 text-xs sm:px-4 sm:py-2">
                        {c.photo_profil ? (
                            <img
                                src={c.photo_profil}
                                alt="Profil"
                                className="w-10 h-10 object-cover rounded-full mx-auto"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 mx-auto">
                              N/A
                            </div>
                        )}
                      </td>
                      <td
                          onClick={() => setSelectedChauffeurId(c.id)}
                          className="px-2 py-2 text-blue-600 hover:underline cursor-pointer font-medium text-sm sm:text-base"
                      >
                        {c.prenom} {c.nom}
                      </td>
                      <td className="px-2 py-2 text-gray-800 text-sm sm:text-base">{c.telephone || 'N/A'}</td>
                      <td className="px-2 py-2 flex flex-col sm:flex-row gap-2 items-center">
                        <button
                            onClick={() => handleEditChauffeur(c)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                        >
                          Modifier
                        </button>
                        <button
                            onClick={() => supprimerChauffeur(c.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}