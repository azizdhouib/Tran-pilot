import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';


export default function Vehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [plaque, setPlaque] = useState('');
  const [modele, setModele] = useState('');
  const [statut, setStatut] = useState('Disponible');
  const [dateControleTechniqueDebut, setDateControleTechniqueDebut] = useState('');
  const [dateControleTechniqueFin, setDateControleTechniqueFin] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [user, setUser] = useState(null); // New state to store the current user

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchVehicules(session.user.id);
      } else {
        console.error("Utilisateur non authentifié. Impossible de charger les véhicules.");
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    // Set up interval for checking notifications
    const notificationInterval = setInterval(() => {
      checkControleTechniqueNotifications(vehicules);
    }, 60 * 1000); // Check every minute (adjust as needed)

    // Initial check when vehicules data changes
    checkControleTechniqueNotifications(vehicules);

    // Clean up interval on component unmount
    return () => clearInterval(notificationInterval);
  }, [vehicules]); // Re-run when vehicules data changes

  function checkControleTechniqueNotifications(vehiclesList) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    vehiclesList.forEach(vehicule => {
      if (vehicule.date_controle_technique_fin) {
        const endDate = new Date(vehicule.date_controle_technique_fin);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays >= 0) {
          // Notify every day during the last week, if not already notified for today
          const lastNotifiedKey = `notified_${vehicule.id}_${endDate.toISOString().split('T')[0]}_${today.toISOString().split('T')[0]}`;
          if (!sessionStorage.getItem(lastNotifiedKey)) {
            // TODO alert(`Notification: Le contrôle technique du véhicule ${vehicule.plaque} (${vehicule.modele}) expire dans ${diffDays} jour(s) !`);
            sessionStorage.setItem(lastNotifiedKey, 'true'); // Store notification status for today
          }
        }
      }
    });
  }


  async function fetchVehicules(userId) {
    if (!userId) {
      setVehicules([]);
      return;
    }
    const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('user_id', userId) // Filter by the current user's ID
        .order('created_at', { ascending: false });
    if (!error) setVehicules(data);
    else console.error('Error fetching vehicles:', error);
  }

  async function ajouterOuModifierVehicule(e) {
    e.preventDefault();
    if (!user) {
      alert("Vous devez être connecté pour ajouter/modifier un véhicule.");
      return;
    }
    const vehicleData = {
      plaque,
      modele,
      statut,
      date_controle_technique_debut: dateControleTechniqueDebut || null, // Ensure empty string becomes null
      date_controle_technique_fin: dateControleTechniqueFin || null,     // Ensure empty string becomes null
      user_id: user.id
    };

    if (isEditing && editId) {
      const { error } = await supabase
          .from('vehicules')
          .update(vehicleData)
          .eq('id', editId);

      if (!error) {
        resetForm();
        fetchVehicules(user.id); // Refresh with user ID
      } else {
        console.error('Error updating vehicle:', error);
        alert('Erreur lors de la modification du véhicule : ' + error.message);
      }
    } else {
      const { error } = await supabase
          .from('vehicules')
          .insert(vehicleData);

      if (!error) {
        resetForm();
        fetchVehicules(user.id); // Refresh with user ID
      } else {
        console.error('Error adding vehicle:', error);
        alert('Erreur lors de l\'ajout du véhicule : ' + error.message);
      }
    }
  }

  async function supprimerVehicule(id) {
    if (!user) {
      alert("Vous devez être connecté pour supprimer un véhicule.");
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      const { error } = await supabase
          .from('vehicules')
          .delete()
          .eq('id', id);

      if (!error) {
        alert('Véhicule supprimé avec succès!');
        fetchVehicules(user.id); // Refresh with user ID
      } else {
        console.error('Error deleting vehicle:', error);
        alert('Erreur lors de la suppression du véhicule : ' + error.message);
      }
    }
  }

  const modifierVehicule = (vehicule) => {
    setPlaque(vehicule.plaque);
    setModele(vehicule.modele);
    setStatut(vehicule.statut);
    setDateControleTechniqueDebut(vehicule.date_controle_technique_debut || '');
    setDateControleTechniqueFin(vehicule.date_controle_technique_fin || '');
    setIsEditing(true);
    setEditId(vehicule.id);
  };

  const resetForm = () => {
    setPlaque('');
    setModele('');
    setStatut('Disponible');
    setDateControleTechniqueDebut('');
    setDateControleTechniqueFin('');
    setIsEditing(false);
    setEditId(null);
  };

  return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Gestion des Véhicules</h1>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {isEditing ? 'Modifier un Véhicule' : 'Ajouter un Nouveau Véhicule'}
          </h2>
          <form onSubmit={ajouterOuModifierVehicule} className="space-y-4">
            <div>
              <label htmlFor="plaque" className="block text-sm font-medium text-gray-700">Plaque d'immatriculation</label>
              <input
                  type="text"
                  id="plaque"
                  value={plaque}
                  onChange={(e) => setPlaque(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
              />
            </div>
            <div>
              <label htmlFor="modele" className="block text-sm font-medium text-gray-700">Modèle</label>
              <input
                  type="text"
                  id="modele"
                  value={modele}
                  onChange={(e) => setModele(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
              />
            </div>
            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700">Statut</label>
              <select
                  id="statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Disponible">Disponible</option>
                <option value="En affectation">En affectation</option>
                <option value="En maintenance">En maintenance</option>
              </select>
            </div>

            {/* New fields for Contrôle Technique dates */}
            <div>
              <label htmlFor="dateControleTechniqueDebut" className="block text-sm font-medium text-gray-700">Début Contrôle Technique</label>
              <input
                  type="date"
                  id="dateControleTechniqueDebut"
                  value={dateControleTechniqueDebut}
                  onChange={(e) => setDateControleTechniqueDebut(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="dateControleTechniqueFin" className="block text-sm font-medium text-gray-700">Fin Contrôle Technique</label>
              <input
                  type="date"
                  id="dateControleTechniqueFin"
                  value={dateControleTechniqueFin}
                  onChange={(e) => setDateControleTechniqueFin(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              {isEditing && (
                  <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
              )}
              <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? 'Modifier le Véhicule' : 'Ajouter le Véhicule'}
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Plaque</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Modèle</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Statut</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Début CT</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Fin CT</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {vehicules.map((v) => (
                <tr key={v.id}>
                  <td className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{v.plaque}</td>
                  <td className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{v.modele}</td>
                  <td className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">
                  <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                          v.statut === 'Disponible'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {v.statut}
                  </span>
                  </td>
                  <td className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">
                    {v.date_controle_technique_debut ? new Date(v.date_controle_technique_debut).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">
                    {v.date_controle_technique_fin ? new Date(v.date_controle_technique_fin).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-2 py-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <button
                        onClick={() => modifierVehicule(v)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                    >
                      Modifier
                    </button>
                    <button
                        onClick={() => supprimerVehicule(v.id)}
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
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">Carte de localisation</h2>
          <div className="h-[400px] rounded-lg overflow-hidden shadow-lg relative z-0">
            <MapContainer
                center={[48.8566, 2.3522]} // Coordonnées de Paris
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[48.8566, 2.3522]}>
                <Popup>Paris</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
  );
}