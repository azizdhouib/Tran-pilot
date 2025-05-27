import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Affectations() {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [chauffeurId, setChauffeurId] = useState('');
  const [vehiculeId, setVehiculeId] = useState('');

  useEffect(() => {
    fetchChauffeurs();
    fetchVehicules();
  }, []);

  async function fetchChauffeurs() {
    const { data } = await supabase.from('chauffeurs').select('id, nom, prenom, vehicule_id, photo_profil'); // Ajout de 'prenom' pour l'affichage
    setChauffeurs(data || []);
  }

  async function fetchVehicules() {
    const { data } = await supabase.from('vehicules').select('*');
    setVehicules(data || []);
  }

  async function affecterVehicule(e) {
    e.preventDefault();
    if (!chauffeurId || !vehiculeId) return;

    // 1. Affecter le véhicule au chauffeur
    const { error: chauffeurUpdateError } = await supabase
        .from('chauffeurs')
        .update({ vehicule_id: vehiculeId })
        .eq('id', chauffeurId);

    if (chauffeurUpdateError) {
      console.error('Erreur lors de l\'affectation du véhicule au chauffeur :', chauffeurUpdateError);
      alert('Erreur lors de l\'affectation : ' + chauffeurUpdateError.message);
      return;
    }

    // 2. Marquer le véhicule comme indisponible
    const { error: vehiculeUpdateError } = await supabase
        .from('vehicules')
        .update({ statut: 'indisponible' })
        .eq('id', vehiculeId);

    if (vehiculeUpdateError) {
      console.error('Erreur lors de la mise à jour du statut du véhicule :', vehiculeUpdateError);
      alert('Erreur lors de la mise à jour du statut du véhicule : ' + vehiculeUpdateError.message);
      return;
    }

    alert('Véhicule affecté avec succès !');
    setChauffeurId('');
    setVehiculeId('');
    fetchChauffeurs();
    fetchVehicules();
  }

  async function retirerAffectation(chauffeurId) {
    if (confirm('Retirer le véhicule de ce chauffeur ?')) {
      try {
        // 1. Récupérer l'ancien véhicule affecté
        const { data: chauffeur, error: fetchError } = await supabase
            .from('chauffeurs')
            .select('vehicule_id')
            .eq('id', chauffeurId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw fetchError;
        }

        // 2. Enlever l'affectation du chauffeur
        const { error: chauffeurRemoveError } = await supabase
            .from('chauffeurs')
            .update({ vehicule_id: null })
            .eq('id', chauffeurId);

        if (chauffeurRemoveError) throw chauffeurRemoveError;

        // 3. Marquer le véhicule comme disponible (s'il y en avait un)
        if (chauffeur?.vehicule_id) {
          const { error: vehiculeStatusError } = await supabase
              .from('vehicules')
              .update({ statut: 'Disponible' })
              .eq('id', chauffeur.vehicule_id);

          if (vehiculeStatusError) throw vehiculeStatusError;
        }

        alert('Affectation retirée avec succès !');
        fetchChauffeurs();
        fetchVehicules();
      } catch (err) {
        console.error('Erreur lors du retrait de l\'affectation :', err);
        alert('Erreur lors du retrait de l\'affectation : ' + err.message);
      }
    }
  }

  return (
      <div className="p-4 md:p-6 bg-white rounded shadow mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Affecter un véhicule à un chauffeur</h2>

        <form onSubmit={affecterVehicule} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <select value={chauffeurId} onChange={e => setChauffeurId(e.target.value)} required className="border p-2 rounded w-full">
            <option value="">Sélectionner un chauffeur</option>
            {chauffeurs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom} {c.vehicule_id ? '(Déjà affecté)' : ''}
                </option>
            ))}
          </select>

          <select value={vehiculeId} onChange={e => setVehiculeId(e.target.value)} required className="border p-2 rounded w-full">
            <option value="">Sélectionner un véhicule</option>
            {vehicules
                .filter(v => !chauffeurs.some(c => c.vehicule_id === v.id)) // Exclure véhicules déjà affectés
                .map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plaque} - {v.modele}
                    </option>
                ))}
          </select>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full md:w-auto">Affecter</button>
        </form>

        <h3 className="text-lg md:text-xl font-semibold mb-2">Affectations actuelles</h3>
        <div className="mb-4 text-center md:text-left">
          <p className="text-lg font-semibold">
            Chauffeurs non affectés :{' '}
            <span className="text-red-600">
                        {chauffeurs.filter(c => !c.vehicule_id).length}
                    </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
            <tr>
              <th className="border px-2 py-2 text-left text-xs sm:text-sm">Photo</th>
              <th className="border px-2 py-2 text-left text-xs sm:text-sm">Nom</th>
              <th className="border px-2 py-2 text-left text-xs sm:text-sm">Véhicule</th>
              <th className="border px-2 py-2 text-left text-xs sm:text-sm">Actions</th>
            </tr>
            </thead>
            <tbody>
            {chauffeurs.map(c => {
              const vehicule = vehicules.find(v => v.id === c.vehicule_id);
              const ligneClasse = vehicule ? 'bg-green-100' : 'bg-red-100';

              return (
                  <tr key={c.id} className={ligneClasse}>
                    <td className="border px-2 py-2 text-center">
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
                    <td className="border px-2 py-2 text-xs sm:text-base">{c.prenom} {c.nom}</td> {/* Afficher prénom + nom */}
                    <td className="border px-2 py-2 text-xs sm:text-base">
                      {vehicule ? `${vehicule.plaque} (${vehicule.modele})` : 'Aucun'} {/* Afficher plaque et modèle */}
                    </td>
                    <td className="border px-2 py-2">
                      {vehicule && (
                          <button
                              onClick={() => retirerAffectation(c.id)}
                              className="text-red-600 hover:underline text-xs sm:text-sm w-full"
                          >
                            Retirer
                          </button>
                      )}
                    </td>
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
  );
}