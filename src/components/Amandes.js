import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ContestationPdfDocument from './ContestationPdfDocument';

export default function Amandes() {
    const [amandes, setAmandes] = useState([]);
    const [chauffeurs, setChauffeurs] = useState([]); // Liste de tous les chauffeurs
    const [vehicules, setVehicules] = useState([]); // Liste des véhicules pour le sélecteur de plaque

    // State for the form inputs
    const [chauffeurId, setChauffeurId] = useState(''); // Le chauffeur désigné par l'amande
    const [dateInfraction, setDateInfraction] = useState('');
    const [lieu, setLieu] = useState('');
    const [montant, setMontant] = useState('');
    const [vehiculePlaque, setVehiculePlaque] = useState(''); // La plaque du véhicule associée à l'amende
    const [natureInfraction, setNatureInfraction] = useState('');
    // const [contestationEnvoyee, setContestationEnvoyee] = useState(false); // Champ supprimé

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // **** NOUVEAU : État pour le chauffeur désignant (le gérant/propriétaire) ****
    const [chauffeurDesignant, setChauffeurDesignant] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        await fetchAmandes();
        await fetchChauffeurs();
        await fetchVehicules(); // Assurez-vous que cette fonction s'exécute correctement

        // **** NOUVEAU : Définir le chauffeur désignant ****
        // Ici, vous devrez implémenter la logique pour récupérer le profil du gérant/propriétaire.
        // Pour cet exemple, nous allons prendre le premier chauffeur trouvé comme "désignant".
        // C'EST UNE SIMPLIFICATION, à adapter selon votre gestion d'utilisateurs.
        const { data: gerantData, error: gerantError } = await supabase.from('chauffeurs').select('*').limit(1);
        if (gerantData && gerantData.length > 0) {
            setChauffeurDesignant(gerantData[0]);
        } else if (gerantError) {
            console.error("Erreur lors de la récupération du chauffeur désignant :", gerantError);
        }
    }

    async function fetchAmandes() {
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
            .order('date_infraction', { ascending: false });
        if (!error) setAmandes(data);
        else console.error('Error fetching fines:', error);
    }

    async function fetchChauffeurs() {
        const { data, error } = await supabase.from('chauffeurs').select('id, nom, prenom, adresse_rue, adresse_cp, adresse_ville, permis_numero');
        if (!error) setChauffeurs(data);
        else console.error('Error fetching chauffeurs:', error);
    }

    async function fetchVehicules() {
        const { data, error } = await supabase.from('vehicules').select('id, plaque, modele');
        // CORRECTION ICI : la condition `if (!!error)` a été changée en `if (error)`
        if (error) { // Si il y a une erreur, on la log
            console.error('Error fetching vehicles:', error);
        } else { // Sinon, on met à jour le state
            setVehicules(data);
        }
    }

    async function ajouterOuModifierAmande(e) {
        e.preventDefault();
        const payload = {
            chauffeur_id: chauffeurId || null,
            date_infraction: dateInfraction,
            lieu: lieu,
            montant: parseFloat(montant),
            vehicule_plaque: vehiculePlaque || null, // S'assure que la plaque sélectionnée est bien passée
            nature_infraction: natureInfraction,
            // contestation_envoyee: contestationEnvoyee, // Champ supprimé du payload
        };

        if (isEditing && editId) {
            const { error } = await supabase
                .from('amendes')
                .update(payload)
                .eq('id', editId);
            if (!error) {
                resetForm();
                fetchAmandes();
            } else console.error('Error updating fine:', error);
        } else {
            const { error } = await supabase
                .from('amendes')
                .insert(payload);
            if (!error) {
                resetForm();
                fetchAmandes();
            } else console.error('Error adding fine:', error);
        }
    }

    async function supprimerAmande(id) {
        const confirmation = window.confirm('Supprimer cette amande ?');
        if (!confirmation) return;
        const { error } = await supabase.from('amendes').delete().eq('id', id);
        if (!error) fetchAmandes();
        else console.error('Error deleting fine:', error);
    }

    function modifierAmande(amande) {
        setChauffeurId(amande.chauffeur_id || '');
        setDateInfraction(amande.date_infraction);
        setLieu(amande.lieu);
        setMontant(amande.montant.toString());
        setVehiculePlaque(amande.vehicule_plaque || ''); // La valeur de la plaque est récupérée ici
        setNatureInfraction(amande.nature_infraction);
        // setContestationEnvoyee(amande.contestation_envoyee); // Supprimé
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
        // setContestationEnvoyee(false); // Supprimé
        setEditId(null);
        setIsEditing(false);
    }

    // Fonction `getStatutClass` est maintenant obsolète car le champ est supprimé
    // const getStatutClass = (contested) => {
    //     return contested ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';
    // };

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Gestion des Amendes</h2>

            <h3 className="text-lg font-semibold mt-6 mb-2">{isEditing ? 'Modifier une Amande' : 'Ajouter une Nouvelle Amande'}</h3>
            <form onSubmit={ajouterOuModifierAmande} className="mb-6 flex flex-wrap gap-4 items-end">
                <select
                    value={chauffeurId}
                    onChange={e => setChauffeurId(e.target.value)}
                    className="border px-3 py-2 rounded-md"
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
                    className="border px-3 py-2 rounded-md"
                    required
                />
                <input
                    placeholder="Lieu de l'infraction"
                    value={lieu}
                    onChange={e => setLieu(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                    required
                />
                <input
                    type="number"
                    placeholder="Montant (€)"
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                    step="0.01"
                    required
                />
                {/* SELECTEUR DE PLAQUE : MAINTENANT UTILISE VEHICULES POUR OBTENIR LES PLAQUES */}
                <select
                    value={vehiculePlaque}
                    onChange={e => setVehiculePlaque(e.target.value)}
                    className="border px-3 py-2 rounded-md"
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
                    className="border px-3 py-2 rounded-md"
                />
                {/* CHECKBOX "Contestation Envoyée" SUPPRIMÉE */}
                {/*
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={contestationEnvoyee}
                        onChange={e => setContestationEnvoyee(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    Contestation Envoyée
                </label>
                */}

                <button
                    type="submit"
                    className={`text-white font-medium px-4 py-2 rounded-md shadow ${
                        isEditing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isEditing ? 'Modifier amande' : '+ Nouvelle Amande'}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        onClick={resetForm}
                        className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded-md shadow"
                    >
                        Annuler
                    </button>
                )}
            </form>

            <table className="min-w-full bg-gray-50 border border-gray-200">
                <thead>
                <tr>
                    <th className="py-2 px-4 border">Chauffeur Désigné</th>
                    <th className="py-2 px-4 border">Date</th>
                    <th className="py-2 px-4 border">Lieu</th>
                    <th className="py-2 px-4 border">Montant</th>
                    <th className="py-2 px-4 border">Plaque Véhicule</th>
                    <th className="py-2 px-4 border">Nature Infraction</th>
                    {/* EN-TÊTE DE COLONNE "Contestée" SUPPRIMÉE */}
                    {/* <th className="py-2 px-4 border">Contestée</th> */}
                    <th className="py-2 px-4 border">Actions</th>
                </tr>
                </thead>
                <tbody>
                {amandes.map(amande => (
                    <tr key={amande.id}>
                        <td className="border px-4 py-2">
                            {amande.chauffeurs ? `${amande.chauffeurs.prenom} ${amande.chauffeurs.nom}` : 'N/A'}
                        </td>
                        <td className="border px-4 py-2">{amande.date_infraction}</td>
                        <td className="border px-4 py-2">{amande.lieu}</td>
                        <td className="border px-4 py-2">{amande.montant.toFixed(2)} €</td>
                        <td className="border px-4 py-2">{amande.vehicule_plaque || 'N/A'}</td>
                        <td className="border px-4 py-2">{amande.nature_infraction || 'N/A'}</td>
                        {/* CELLULE "Contestée" SUPPRIMÉE */}
                        {/*
                        <td className="border px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutClass(amande.contestation_envoyee)}`}>
                            {amande.contestation_envoyee ? 'Oui' : 'Non'}
                            </span>
                        </td>
                        */}
                        <td className="border px-4 py-2 flex gap-2">
                            <button
                                onClick={() => modifierAmande(amande)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
                            >
                                Modifier
                            </button>
                            <button
                                onClick={() => supprimerAmande(amande.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                            >
                                Supprimer
                            </button>
                            {/* PDF Generation Button - Pass both chauffeurs if available */}
                            {chauffeurDesignant && amande.chauffeurs && amande.vehicule_plaque && (
                                <PDFDownloadLink
                                    document={<ContestationPdfDocument
                                        amande={amande}
                                        chauffeurDesignant={chauffeurDesignant} // Le gérant/propriétaire
                                        chauffeurDesigne={amande.chauffeurs} // Le chauffeur de l'amande
                                    />}
                                    fileName={`designation_${amande.date_infraction}_${amande.chauffeurs.nom}.pdf`}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center justify-center"
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
    );
}