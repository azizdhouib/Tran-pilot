import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ChauffeurForm({ chauffeur, onClose, onSave }) {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');
    const [email, setEmail] = useState('');
    const [statut, setStatut] = useState('actif'); // Default for new chauffeur
    const [adresseRue, setAdresseRue] = useState('');
    const [adresseCp, setAdresseCp] = useState('');
    const [adresseVille, setAdresseVille] = useState('');
    const [permisNumero, setPermisNumero] = useState('');
    const [dateNaissance, setDateNaissance] = useState('');
    const [lieuNaissance, setLieuNaissance] = useState('');
    const [permisDelivranceDate, setPermisDelivranceDate] = useState('');
    const [permisDelivranceLieu, setPermisDelivranceLieu] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Populate form if an existing chauffeur object is passed (for editing)
    useEffect(() => {
        if (chauffeur) {
            setNom(chauffeur.nom || '');
            setPrenom(chauffeur.prenom || '');
            setTelephone(chauffeur.telephone || '');
            setEmail(chauffeur.email || '');
            setStatut(chauffeur.statut || 'actif');
            setAdresseRue(chauffeur.adresse_rue || '');
            setAdresseCp(chauffeur.adresse_cp || '');
            setAdresseVille(chauffeur.adresse_ville || '');
            setPermisNumero(chauffeur.permis_numero || '');
            setDateNaissance(chauffeur.date_naissance || '');
            setLieuNaissance(chauffeur.lieu_naissance || '');
            setPermisDelivranceDate(chauffeur.permis_delivrance_date || '');
            setPermisDelivranceLieu(chauffeur.permis_delivrance_lieu || '');
        } else {
            // Reset for new chauffeur
            setNom('');
            setPrenom('');
            setTelephone('');
            setEmail('');
            setStatut('actif'); // Default for new
            setAdresseRue('');
            setAdresseCp('');
            setAdresseVille('');
            setPermisNumero('');
            setDateNaissance('');
            setLieuNaissance('');
            setPermisDelivranceDate('');
            setPermisDelivranceLieu('');
        }
    }, [chauffeur]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            nom,
            prenom,
            telephone,
            email,
            statut,
            adresse_rue: adresseRue,
            adresse_cp: adresseCp,
            adresse_ville: adresseVille,
            permis_numero: permisNumero,
            date_naissance: dateNaissance,
            lieu_naissance: lieuNaissance,
            permis_delivrance_date: permisDelivranceDate,
            permis_delivrance_lieu: permisDelivranceLieu,
            // vehicule_id and photos are handled in ChauffeurProfil if needed,
            // but for initial creation/basic edit, they are not included here.
        };

        try {
            if (chauffeur && chauffeur.id) {
                // Editing existing chauffeur
                const { error: updateError } = await supabase
                    .from('chauffeurs')
                    .update(payload)
                    .eq('id', chauffeur.id);

                if (updateError) throw updateError;
                alert('Chauffeur mis à jour avec succès !');
            } else {
                // Adding new chauffeur
                const { error: insertError } = await supabase
                    .from('chauffeurs')
                    .insert(payload);

                if (insertError) throw insertError;
                alert('Nouveau chauffeur ajouté avec succès !');
            }
            onSave(); // Callback to refresh list in parent (Chauffeurs.js)
            onClose(); // Close the form modal
        } catch (err) {
            console.error('Error saving chauffeur:', err);
            setError(err.message);
            alert('Erreur lors de l\'enregistrement : ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full m-auto relative max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                    {chauffeur ? 'Modifier le Chauffeur' : 'Ajouter un Nouveau Chauffeur'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h4 className="text-lg font-semibold border-b pb-2 mb-4">Informations Personnelles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                            <input
                                type="text"
                                id="prenom"
                                value={prenom}
                                onChange={e => setPrenom(e.target.value)}
                                placeholder="Prénom"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
                            <input
                                type="text"
                                id="nom"
                                value={nom}
                                onChange={e => setNom(e.target.value)}
                                placeholder="Nom"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                            <input
                                type="text"
                                id="telephone"
                                value={telephone}
                                onChange={e => setTelephone(e.target.value)}
                                placeholder="Téléphone"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="statut" className="block text-sm font-medium text-gray-700">Statut</label>
                            <select
                                id="statut"
                                value={statut}
                                onChange={e => setStatut(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="actif">Actif</option>
                                <option value="inactif">Inactif</option>
                                <option value="en_vacances">En vacances</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-700">Date de Naissance</label>
                            <input
                                type="date"
                                id="dateNaissance"
                                value={dateNaissance}
                                onChange={e => setDateNaissance(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="lieuNaissance" className="block text-sm font-medium text-gray-700">Lieu de Naissance</label>
                            <input
                                type="text"
                                id="lieuNaissance"
                                value={lieuNaissance}
                                onChange={e => setLieuNaissance(e.target.value)}
                                placeholder="Lieu de naissance"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <h4 className="text-lg font-semibold border-b pb-2 mb-4 pt-4">Informations Permis de Conduire</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="permisNumero" className="block text-sm font-medium text-gray-700">Numéro Permis</label>
                            <input
                                type="text"
                                id="permisNumero"
                                value={permisNumero}
                                onChange={e => setPermisNumero(e.target.value)}
                                placeholder="Numéro du permis"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="permisDelivranceDate" className="block text-sm font-medium text-gray-700">Délivré le</label>
                            <input
                                type="date"
                                id="permisDelivranceDate"
                                value={permisDelivranceDate}
                                onChange={e => setPermisDelivranceDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2"> {/* This input can span two columns */}
                            <label htmlFor="permisDelivranceLieu" className="block text-sm font-medium text-gray-700">Délivré par/à</label>
                            <input
                                type="text"
                                id="permisDelivranceLieu"
                                value={permisDelivranceLieu}
                                onChange={e => setPermisDelivranceLieu(e.target.value)}
                                placeholder="Ville ou autorité de délivrance"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <h4 className="text-lg font-semibold border-b pb-2 mb-4 pt-4">Adresse</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="adresseRue" className="block text-sm font-medium text-gray-700">Rue</label>
                            <input
                                type="text"
                                id="adresseRue"
                                value={adresseRue}
                                onChange={e => setAdresseRue(e.target.value)}
                                placeholder="Numéro et nom de rue"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="adresseCp" className="block text-sm font-medium text-gray-700">Code Postal</label>
                            <input
                                type="text"
                                id="adresseCp"
                                value={adresseCp}
                                onChange={e => setAdresseCp(e.target.value)}
                                placeholder="Code postal"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2"> {/* This input can span two columns */}
                            <label htmlFor="adresseVille" className="block text-sm font-medium text-gray-700">Ville</label>
                            <input
                                type="text"
                                id="adresseVille"
                                value={adresseVille}
                                onChange={e => setAdresseVille(e.target.value)}
                                placeholder="Ville"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : (chauffeur ? 'Mettre à jour' : 'Ajouter')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}