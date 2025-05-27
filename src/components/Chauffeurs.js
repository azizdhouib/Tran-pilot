import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ChauffeurProfil from './ChauffeurProfil';
import ChauffeurForm from './ChauffeurForm'; // Import the new form component

export default function Chauffeurs() {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [chauffeurToEdit, setChauffeurToEdit] = useState(null);

  useEffect(() => {
    fetchChauffeurs();
  }, []);

  async function fetchChauffeurs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
          .from('chauffeurs')
          .select('*')
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
        // Before deleting the chauffeur, set their vehicule_id to null if they have one
        // And set the vehicle's status to 'Disponible'
        const { data: chauffeurData, error: fetchError } = await supabase
            .from('chauffeurs')
            .select('vehicule_id')
            .eq('id', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found (already deleted, etc.)
          throw fetchError;
        }

        if (chauffeurData && chauffeurData.vehicule_id) {
          await supabase
              .from('vehicules')
              .update({ statut: 'Disponible' })
              .eq('id', chauffeurData.vehicule_id);
        }

        // Now delete the chauffeur
        const { error: deleteError } = await supabase
            .from('chauffeurs')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        alert('Chauffeur supprimé avec succès !');
        await fetchChauffeurs(); // Refresh the list
      } catch (err) {
        console.error('Error deleting chauffeur:', err);
        alert('Erreur lors de la suppression du chauffeur : ' + err.message);
      }
    }
  }

  function handleEditChauffeur(chauffeur) {
    setChauffeurToEdit(chauffeur);
    setShowAddForm(true); // Open the form in edit mode
  }

  // This function will be called when a chauffeur is successfully added/updated
  const handleChauffeurSaved = () => {
    fetchChauffeurs(); // Re-fetch the list to show new/updated data
    setShowAddForm(false); // Close the form
    setChauffeurToEdit(null); // Clear the edit state
  };

  if (selectedChauffeurId) {
    return <ChauffeurProfil
        chauffeurId={selectedChauffeurId}
        retour={() => setSelectedChauffeurId(null)}
    />;
  }

  return (
      <div className="p-4 md:p-6"> {/* Adjusted padding for smaller screens */}
        <h2 className="text-xl font-bold mb-4">Gestion des Chauffeurs</h2>

        <div className="mb-6 flex justify-end">
          <button
              onClick={() => { setShowAddForm(true); setChauffeurToEdit(null); }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
          >
            + Nouveau Chauffeur
          </button>
        </div>

        {/* Render ChauffeurForm as a modal if showAddForm is true */}
        {showAddForm && (
            <ChauffeurForm
                chauffeur={chauffeurToEdit}
                onClose={() => { setShowAddForm(false); setChauffeurToEdit(null); }}
                onSave={handleChauffeurSaved}
            />
        )}

        {loading ? (
            <p>Chargement des chauffeurs...</p>
        ) : (
            <div className="overflow-x-auto"> {/* This class handles horizontal scrolling for the table */}
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prénom Nom</th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Téléphone</th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {chauffeurs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                        Aucun chauffeur trouvé. Cliquez sur "+ Nouveau Chauffeur" pour en ajouter un.
                      </td>
                    </tr>
                ) : (
                    chauffeurs.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-center">
                            {c.photo_profil ? (
                                <img
                                    src={c.photo_profil}
                                    alt="Profil"
                                    className="w-10 h-10 object-cover rounded-full mx-auto border border-gray-200"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 mx-auto">
                                  N/A
                                </div>
                            )}
                          </td>
                          <td
                              onClick={() => setSelectedChauffeurId(c.id)}
                              className="px-4 py-2 text-blue-600 hover:underline cursor-pointer font-medium"
                          >
                            {c.prenom} {c.nom}
                          </td>
                          <td className="px-4 py-2 text-gray-800">{c.telephone || 'N/A'}</td>
                          <td className="px-4 py-2 text-gray-800">{c.email || 'N/A'}</td>
                          <td className="px-4 py-2 space-x-2 flex items-center">
                            <button
                                onClick={() => handleEditChauffeur(c)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                            >
                              Modifier
                            </button>
                            <button
                                onClick={() => supprimerChauffeur(c.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}