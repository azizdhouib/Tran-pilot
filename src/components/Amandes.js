// src/components/Amandes.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ContestationPdfDocument from './ContestationPdfDocument';

export default function Amandes() {
    const [amandes, setAmandes] = useState([]);
    const [chauffeurs, setChauffeurs] = useState([]);
    const [vehicules, setVehicules] = useState([]);

    // State for the form inputs
    const [chauffeurId, setChauffeurId] = useState('');
    const [dateInfraction, setDateInfraction] = useState('');
    const [lieu, setLieu] = useState('');
    const [montant, setMontant] = useState('');
    const [vehiculePlaque, setVehiculePlaque] = useState('');
    const [natureInfraction, setNatureInfraction] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // NEW: État pour le chauffeur désignant (le gérant/propriétaire)
    const [chauffeurDesignant, setChauffeurDesignant] = useState(null);
    const [user, setUser] = useState(null); // State to store the current user


    useEffect(() => {
        const initializeData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                // Call fetchData only after the user is set
                await fetchData(session.user.id);
            } else {
                console.error("Utilisateur non authentifié. Impossible de charger les données des amendes.");
                // Optionally handle redirect to login or show error message to user
            }
        };
        initializeData();
    }, []); // Empty dependency array means this runs once on mount

    async function fetchData(userId) {
        if (!userId) {
            console.error("User ID is missing, cannot fetch data.");
            return;
        }
        await fetchAmandes(userId);
        await fetchChauffeurs(userId);
        await fetchVehicules(userId);

        // Fetch the user's *own* chauffeur if available, to use as the designating chauffeur
        const { data: gerantData, error: gerantError } = await supabase
            .from('chauffeurs')
            .select('*')
            .eq('user_id', userId) // Filter by current user's ID
            .limit(1);

        if (gerantData && gerantData.length > 0) {
            setChauffeurDesignant(gerantData[0]);
        } else if (gerantError) {
            console.error("Erreur lors de la récupération du chauffeur désignant :", gerantError);
        }
    }

    async function fetchAmandes(userId) {
        if (!userId) return; // Ensure userId exists
        const { data, error } = await supabase
            .from('amendes')
            .select(`
                *,
                chauffeurs (
                    id,
                    nom,
                    prenom,
                    adresse_rue,
                    adresse_cp,
                    adresse_ville,
                    permis_numero,
                    date_naissance,
                    lieu_naissance,
                    permis_delivrance_date,
                    permis_delivrance_lieu
                )
            `)
            .eq('user_id', userId) // Filter by the current user's ID
            .order('date_infraction', { ascending: false });
        if (!error) setAmandes(data);
        else console.error('Error fetching fines:', error);
    }

    async function fetchChauffeurs(userId) {
        if (!userId) return; // Ensure userId exists
        const { data, error } = await supabase
            .from('chauffeurs')
            .select('id, prenom, nom')
            .eq('user_id', userId) // Filter by the current user's ID
            .order('prenom', { ascending: true });
        if (!error) setChauffeurs(data);
        else console.error('Error fetching chauffeurs for fines:', error);
    }

    async function fetchVehicules(userId) {
        if (!userId) return; // Ensure userId exists
        const { data, error } = await supabase
            .from('vehicules')
            .select('id, plaque, modele')
            .eq('user_id', userId) // Filter by the current user's ID
            .order('plaque', { ascending: true });
        if (!error) setVehicules(data);
        else console.error('Error fetching vehicles for fines:', error);
    }

    function resetForm() {
        setChauffeurId('');
        setDateInfraction('');
        setLieu('');
        setMontant('');
        setVehiculePlaque('');
        setNatureInfraction('');
        setIsEditing(false);
        setEditId(null);
    }

    async function ajouterOuModifierAmande(e) {
        e.preventDefault();

        if (!user) {
            alert('Utilisateur non authentifié. Veuillez vous connecter.');
            return;
        }

        const payload = {
            chauffeur_id: chauffeurId || null,
            date_infraction: dateInfraction,
            lieu: lieu,
            montant: parseFloat(montant),
            vehicule_plaque: vehiculePlaque,
            nature_infraction: natureInfraction,
            user_id: user.id, // Explicitly set user_id for new or updated records
        };

        if (isEditing && editId) {
            // Update existing fine, filtered by both id and user_id for security
            const { error } = await supabase
                .from('amendes')
                .update(payload)
                .eq('id', editId)
                .eq('user_id', user.id); // Ensure ownership for update
            if (!error) {
                resetForm();
                fetchAmandes(user.id); // Re-fetch for the current user
            } else {
                console.error('Error updating fine:', error);
                alert('Erreur lors de la modification de l\'amande : ' + error.message);
            }
        } else {
            // Add new fine
            const { error } = await supabase
                .from('amendes')
                .insert([payload]); // payload already contains user_id

            if (!error) {
                resetForm();
                fetchAmandes(user.id); // Re-fetch for the current user
            } else {
                console.error('Error adding fine:', error);
                alert('Erreur lors de l\'ajout de l\'amande : ' + error.message);
            }
        }
    }

    function modifierAmande(amande) {
        setChauffeurId(amande.chauffeur_id || '');
        setDateInfraction(amande.date_infraction);
        setLieu(amande.lieu);
        setMontant(amande.montant);
        setVehiculePlaque(amande.vehicule_plaque);
        setNatureInfraction(amande.nature_infraction);
        setIsEditing(true);
        setEditId(amande.id);
    }

    async function supprimerAmande(id) {
        if (!user) {
            alert('Utilisateur non authentifié. Veuillez vous connecter.');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir supprimer cette amande ? Cette action est irréversible.')) {
            try {
                // Delete fine, filtered by both id and user_id for security
                const { error } = await supabase
                    .from('amendes')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id); // Ensure ownership for delete
                if (error) throw error;
                alert('Amande supprimée avec succès!');
                fetchAmandes(user.id); // Re-fetch for the current user
            } catch (err) {
                console.error('Error deleting fine:', err);
                alert('Erreur lors de la suppression de l\'amande : ' + err.message);
            }
        }
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Gestion des Amendes</h1>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">{isEditing ? 'Modifier une Amande' : 'Ajouter une Nouvelle Amande'}</h2>
                <form onSubmit={ajouterOuModifierAmande} className="space-y-4">
                    <div>
                        <label htmlFor="chauffeurId" className="block text-gray-700 text-sm font-bold mb-2">Chauffeur Associé:</label>
                        <select
                            id="chauffeurId"
                            value={chauffeurId}
                            onChange={(e) => setChauffeurId(e.target.value)}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="">Sélectionner un chauffeur</option>
                            {chauffeurs.map((chauffeur) => (
                                <option key={chauffeur.id} value={chauffeur.id}>
                                    {chauffeur.prenom} {chauffeur.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateInfraction" className="block text-gray-700 text-sm font-bold mb-2">Date de l'Infraction:</label>
                        <input
                            type="date"
                            id="dateInfraction"
                            value={dateInfraction}
                            onChange={(e) => setDateInfraction(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div>
                        <label htmlFor="lieu" className="block text-gray-700 text-sm font-bold mb-2">Lieu:</label>
                        <input
                            type="text"
                            id="lieu"
                            value={lieu}
                            onChange={(e) => setLieu(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div>
                        <label htmlFor="montant" className="block text-gray-700 text-sm font-bold mb-2">Montant (€):</label>
                        <input
                            type="number"
                            id="montant"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div>
                        <label htmlFor="vehiculePlaque" className="block text-gray-700 text-sm font-bold mb-2">Plaque Véhicule:</label>
                        <select
                            id="vehiculePlaque"
                            value={vehiculePlaque}
                            onChange={(e) => setVehiculePlaque(e.target.value)}
                            required
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="">Sélectionner un véhicule</option>
                            {vehicules.map((vehicule) => (
                                <option key={vehicule.id} value={vehicule.plaque}>
                                    {vehicule.plaque} ({vehicule.modele})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="natureInfraction" className="block text-gray-700 text-sm font-bold mb-2">Nature de l'Infraction:</label>
                        <textarea
                            id="natureInfraction"
                            value={natureInfraction}
                            onChange={(e) => setNatureInfraction(e.target.value)}
                            required
                            rows="3"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
                        ></textarea>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            {isEditing ? 'Modifier l\'Amande' : 'Ajouter l\'Amande'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Annuler
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Liste des Amendes</h2>
                {amandes.length === 0 ? (
                    <p className="text-center text-gray-600">Aucune amande trouvée.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Date</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Chauffeur</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Lieu</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Montant</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Véhicule</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Nature Infraction</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-4 sm:text-sm">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {amandes.map((amande) => (
                            <tr key={amande.id}>
                                <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{new Date(amande.date_infraction).toLocaleDateString()}</td>
                                <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">
                                    {amande.chauffeurs ? `${amande.chauffeurs.prenom} ${amande.chauffeurs.nom}` : 'N/A'}
                                </td>
                                <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.lieu}</td>
                                <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.montant} €</td>
                                <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.vehicule_plaque}</td>
                                <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.nature_infraction}</td>
                                <td className="border px-2 py-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
                                    <button
                                        onClick={() => modifierAmande(amande)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => supprimerAmande(amande.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                                    >
                                        Supprimer
                                    </button>
                                    {chauffeurDesignant && amande.chauffeurs && amande.vehicule_plaque && (
                                        <PDFDownloadLink
                                            document={<ContestationPdfDocument
                                                amande={amande}
                                                chauffeurDesignant={chauffeurDesignant}
                                                chauffeurDesigne={amande.chauffeurs}
                                            />}
                                            fileName={`designation_${amande.date_infraction}_${amande.chauffeurs.nom}.pdf`}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm flex items-center justify-center w-full"
                                        >
                                            {({ loading }) => (loading ? 'Génération...' : 'Désigner PDF')}
                                        </PDFDownloadLink>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}