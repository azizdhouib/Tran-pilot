import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ContestationPdfDocument from './ContestationPdfDocument';

export default function Amandes() {
    const [amandes, setAmandes] = useState([]); // Keeps 'amandes'
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

    // NOUVEAU : État pour le chauffeur désignant (le gérant/propriétaire)
    const [chauffeurDesignant, setChauffeurDesignant] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        await fetchAmandes(); // Keeps 'fetchAmandes'
        await fetchChauffeurs();
        await fetchVehicules();

        const { data: gerantData, error: gerantError } = await supabase.from('chauffeurs').select('*').limit(1);
        if (gerantData && gerantData.length > 0) {
            setChauffeurDesignant(gerantData[0]);
        } else if (gerantError) {
            console.error("Erreur lors de la récupération du chauffeur désignant :", gerantError);
        }
    }

    async function fetchAmandes() { // Keeps 'fetchAmandes'
        const { data, error } = await supabase
            .from('amendes') // !!! ONLY THIS LINE CHANGED to 'amendes' !!!
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
            .order('date_infraction', { ascending: false });
        if (!error) setAmandes(data); // Keeps 'setAmandes'
        else console.error('Error fetching fines:', error);
    }

    async function fetchChauffeurs() {
        const { data, error } = await supabase.from('chauffeurs').select('id, nom, prenom, adresse_rue, adresse_cp, adresse_ville, permis_numero');
        if (!error) setChauffeurs(data);
        else console.error('Error fetching chauffeurs:', error);
    }

    async function fetchVehicules() {
        const { data, error } = await supabase.from('vehicules').select('id, plaque, modele');
        if (error) {
            console.error('Error fetching vehicles:', error);
        } else {
            setVehicules(data);
        }
    }

    async function ajouterOuModifierAmande(e) { // Keeps 'ajouterOuModifierAmande'
        e.preventDefault();
        const payload = {
            chauffeur_id: chauffeurId || null,
            date_infraction: dateInfraction,
            lieu: lieu,
            montant: parseFloat(montant),
            vehicule_plaque: vehiculePlaque || null,
            nature_infraction: natureInfraction,
        };

        if (isEditing && editId) {
            const { error } = await supabase
                .from('amendes') // !!! ONLY THIS LINE CHANGED to 'amendes' !!!
                .update(payload)
                .eq('id', editId);
            if (!error) {
                resetForm();
                fetchAmandes(); // Keeps 'fetchAmandes'
            } else console.error('Error updating fine:', error);
        } else {
            const { error } = await supabase
                .from('amendes') // !!! ONLY THIS LINE CHANGED to 'amendes' !!!
                .insert(payload);
            if (!error) {
                resetForm();
                fetchAmandes(); // Keeps 'fetchAmandes'
            } else console.error('Error adding fine:', error);
        }
    }

    async function supprimerAmande(id) { // Keeps 'supprimerAmande'
        const confirmation = window.confirm('Supprimer cette amande ?');
        if (!confirmation) return;
        const { error } = await supabase.from('amendes').delete().eq('id', id); // !!! ONLY THIS LINE CHANGED to 'amendes' !!!
        if (!error) fetchAmandes(); // Keeps 'fetchAmandes'
        else console.error('Error deleting fine:', error);
    }

    function modifierAmande(amande) { // Keeps 'modifierAmande' and 'amande' parameter
        setChauffeurId(amande.chauffeur_id || '');
        setDateInfraction(amande.date_infraction);
        setLieu(amande.lieu);
        setMontant(amande.montant.toString());
        setVehiculePlaque(amande.vehicule_plaque || '');
        setNatureInfraction(amande.nature_infraction);
        setEditId(amande.id);
        setIsEditing(true);
    }

    function resetForm() {
        setChauffeurId('');
        setDateInfraction('');
        setLieu('');
        setMontant('');
        setVehiculePlaque('');
        setNatureInfraction('');
        setEditId(null);
        setIsEditing(false);
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded shadow mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Gestion des Amendes</h2>

            <h3 className="text-lg md:text-xl font-semibold mt-6 mb-2">{isEditing ? 'Modifier une Amande' : 'Ajouter une Nouvelle Amande'}</h3>
            <form onSubmit={ajouterOuModifierAmande} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <select
                    value={chauffeurId}
                    onChange={e => setChauffeurId(e.target.value)}
                    className="border px-3 py-2 rounded-md w-full"
                >
                    <option value="">Sélectionner un Chauffeur</option>
                    {chauffeurs.map(chauffeur => (
                        <option key={chauffeur.id} value={chauffeur.id}>{chauffeur.prenom} {chauffeur.nom}</option>
                    ))}
                </select>
                <input
                    type="date"
                    placeholder="Date Infraction"
                    value={dateInfraction}
                    onChange={e => setDateInfraction(e.target.value)}
                    className="border px-3 py-2 rounded-md w-full"
                    required
                />
                <input
                    placeholder="Lieu de l'infraction"
                    value={lieu}
                    onChange={e => setLieu(e.target.value)}
                    className="border px-3 py-2 rounded-md w-full"
                    required
                />
                <input
                    type="number"
                    placeholder="Montant (€)"
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    className="border px-3 py-2 rounded-md w-full"
                    step="0.01"
                    required
                />
                <select
                    value={vehiculePlaque}
                    onChange={e => setVehiculePlaque(e.target.value)}
                    className="border px-3 py-2 rounded-md w-full"
                >
                    <option value="">Sélectionner une Plaque (facultatif)</option>
                    {vehicules.map(v => (
                        <option key={v.id} value={v.plaque}>{v.plaque} ({v.modele})</option>
                    ))}
                </select>
                <input
                    placeholder="Nature de l'infraction"
                    value={natureInfraction}
                    onChange={e => setNatureInfraction(e.target.value)}
                    className="border px-3 py-2 rounded-md w-full"
                />

                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3 mt-2">
                    <button
                        type="submit"
                        className={`text-white font-medium px-4 py-2 rounded-md shadow w-full sm:w-auto ${
                            isEditing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isEditing ? 'Modifier amande' : '+ Nouvelle Amande'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded-md shadow w-full sm:w-auto"
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 border border-gray-200">
                    <thead>
                    <tr>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Chauffeur Désigné</th>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Date</th>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Lieu</th>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Montant</th>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Plaque Véhicule</th>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Nature Infraction</th>
                        <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {amandes.map(amande => ( // Keeps 'amandes.map(amande => ...)'
                        <tr key={amande.id}>
                            <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">
                                {amande.chauffeurs ? `${amande.chauffeurs.prenom} ${amande.chauffeurs.nom}` : 'N/A'}
                            </td>
                            <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.date_infraction}</td>
                            <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.lieu}</td>
                            <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.montant.toFixed(2)} €</td>
                            <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.vehicule_plaque || 'N/A'}</td>
                            <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{amande.nature_infraction || 'N/A'}</td>
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
            </div>
        </div>
    );
}