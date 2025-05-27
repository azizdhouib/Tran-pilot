import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChauffeurProfil({ chauffeurId, retour }) {
    const [chauffeur, setChauffeur] = useState(null);
    const [vehicules, setVehicules] = useState([]);
    const [vehiculeId, setVehiculeId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingVehicle, setUpdatingVehicle] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState('');

    // State for editable driver fields
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');
    const [email, setEmail] = useState('');
    const [statut, setStatut] = useState('actif');
    const [adresseRue, setAdresseRue] = useState('');
    const [adresseCp, setAdresseCp] = useState('');
    const [adresseVille, setAdresseVille] = useState('');
    const [permisNumero, setPermisNumero] = useState('');
    // NEW STATES FOR ADDITIONAL FIELDS
    const [dateNaissance, setDateNaissance] = useState('');
    const [lieuNaissance, setLieuNaissance] = useState('');
    const [permisDelivranceDate, setPermisDelivranceDate] = useState('');
    const [permisDelivranceLieu, setPermisDelivranceLieu] = useState('');


    useEffect(() => {
        fetchChauffeurDataAndVehicles();
    }, [chauffeurId]);

    async function fetchChauffeurDataAndVehicles() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('chauffeurs')
                .select('*')
                .eq('id', chauffeurId)
                .single();

            if (error) throw error;

            setChauffeur(data);
            setNom(data.nom || '');
            setPrenom(data.prenom || '');
            setTelephone(data.telephone || '');
            setEmail(data.email || '');
            setStatut(data.statut || 'actif');
            setAdresseRue(data.adresse_rue || '');
            setAdresseCp(data.adresse_cp || '');
            setAdresseVille(data.adresse_ville || '');
            setPermisNumero(data.permis_numero || '');
            // Initialize new states with fetched data
            setDateNaissance(data.date_naissance || '');
            setLieuNaissance(data.lieu_naissance || '');
            setPermisDelivranceDate(data.permis_delivrance_date || '');
            setPermisDelivranceLieu(data.permis_delivrance_lieu || '');

            setVehiculeId(data.vehicule_id || '');

            const { data: vehiculesData, error: vehiculesError } = await supabase.from('vehicules').select('*');
            if (vehiculesError) throw vehiculesError;
            setVehicules(vehiculesData || []);

        } catch (err) {
            setError(err.message);
            console.error('Error fetching chauffeur or vehicles:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateChauffeur(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('chauffeurs')
                .update({
                    nom: nom,
                    prenom: prenom,
                    telephone: telephone,
                    email: email,
                    statut: statut,
                    adresse_rue: adresseRue,
                    adresse_cp: adresseCp,
                    adresse_ville: adresseVille,
                    permis_numero: permisNumero,
                    // Include new fields in the update payload
                    date_naissance: dateNaissance,
                    lieu_naissance: lieuNaissance,
                    permis_delivrance_date: permisDelivranceDate,
                    permis_delivrance_lieu: permisDelivranceLieu,
                })
                .eq('id', chauffeurId);

            if (updateError) throw updateError;

            alert('Informations du chauffeur mises à jour avec succès !');
            await fetchChauffeurDataAndVehicles();
        } catch (err) {
            alert('Erreur lors de la mise à jour : ' + err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleImageUpload(e, type) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return alert('Veuillez sélectionner une image valide.');
        }
        if (file.size > 5 * 1024 * 1024) {
            return alert('La taille maximale est de 5MB.');
        }

        setUploadingPhoto(type);
        try {
            const filePath = `${type}/${chauffeurId}-${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase
                .storage
                .from('chauffeur-media')
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: '3600'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('chauffeur-media')
                .getPublicUrl(filePath);

            const updateData = {};
            if (type === 'photo_profil') updateData.photo_profil = publicUrl;
            if (type === 'photo_permis') updateData.photo_permis = publicUrl;

            const { error: updateError } = await supabase
                .from('chauffeurs')
                .update(updateData)
                .eq('id', chauffeurId);

            if (updateError) throw updateError;

            await fetchChauffeurDataAndVehicles();
            alert('Photo mise à jour avec succès !');
        } catch (err) {
            console.error('Upload error:', err);
            alert("Erreur upload : " + err.message);
        } finally {
            setUploadingPhoto('');
        }
    }

    async function handleVehiculeChange() {
        setUpdatingVehicle(true);
        try {
            const { data: chauffeurData, error: fetchChauffeurError } = await supabase
                .from('chauffeurs')
                .select('vehicule_id')
                .eq('id', chauffeurId)
                .single();

            if (fetchChauffeurError) throw fetchChauffeurError;

            const ancienVehiculeId = chauffeurData.vehicule_id;

            const { error: updateChauffeurError } = await supabase
                .from('chauffeurs')
                .update({ vehicule_id: vehiculeId === '' ? null : vehiculeId })
                .eq('id', chauffeurId);

            if (updateChauffeurError) throw updateChauffeurError;

            if (ancienVehiculeId && ancienVehiculeId !== vehiculeId) {
                const { error: updateOldVehiculeError } = await supabase
                    .from('vehicules')
                    .update({ statut: 'Disponible' })
                    .eq('id', ancienVehiculeId);
                if (updateOldVehiculeError) throw updateOldVehiculeError;
            }

            if (vehiculeId) {
                const { error: updateNewVehiculeError } = await supabase
                    .from('vehicules')
                    .update({ statut: 'Indisponible' })
                    .eq('id', vehiculeId);
                if (updateNewVehiculeError) throw updateNewVehiculeError;
            }

            alert('Véhicule mis à jour avec succès !');
            await fetchChauffeurDataAndVehicles();
        } catch (err) {
            alert('Erreur: ' + err.message);
            console.error('Error updating vehicle:', err);
        } finally {
            setUpdatingVehicle(false);
        }
    }

    if (loading) return <div className="p-6">Chargement du profil...</div>;
    if (error) return <div className="p-6 text-red-500">Erreur: {error}</div>;
    if (!chauffeur) return <div className="p-6">Chauffeur non trouvé.</div>;

    return (
        <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
            <button
                onClick={retour}
                className="mb-4 text-blue-600 hover:underline flex items-center"
            >
                ← Retour à la liste
            </button>

            <h2 className="text-2xl font-semibold mb-4">Profil de {prenom} {nom}</h2> {/* Use state variables here */}

            <form onSubmit={handleUpdateChauffeur} className="mb-8 p-4 border rounded-md bg-gray-50">
                <h3 className="text-xl font-semibold mb-4">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                        <input
                            type="text"
                            id="prenom"
                            value={prenom}
                            onChange={(e) => setPrenom(e.target.value)}
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
                            onChange={(e) => setNom(e.target.value)}
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
                            onChange={(e) => setTelephone(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="statut" className="block text-sm font-medium text-gray-700">Statut</label>
                        <select
                            id="statut"
                            value={statut}
                            onChange={(e) => setStatut(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                            <option value="en_vacances">En vacances</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="permisNumero" className="block text-sm font-medium text-gray-700">Numéro Permis</label>
                        <input
                            type="text"
                            id="permisNumero"
                            value={permisNumero}
                            onChange={(e) => setPermisNumero(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    {/* NEW: Date de naissance */}
                    <div>
                        <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-700">Date de Naissance</label>
                        <input
                            type="date"
                            id="dateNaissance"
                            value={dateNaissance}
                            onChange={(e) => setDateNaissance(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    {/* NEW: Lieu de naissance */}
                    <div>
                        <label htmlFor="lieuNaissance" className="block text-sm font-medium text-gray-700">Lieu de Naissance</label>
                        <input
                            type="text"
                            id="lieuNaissance"
                            value={lieuNaissance}
                            onChange={(e) => setLieuNaissance(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    {/* NEW: Permis délivrance date */}
                    <div>
                        <label htmlFor="permisDelivranceDate" className="block text-sm font-medium text-gray-700">Permis Délivré le</label>
                        <input
                            type="date"
                            id="permisDelivranceDate"
                            value={permisDelivranceDate}
                            onChange={(e) => setPermisDelivranceDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    {/* NEW: Permis délivrance lieu */}
                    <div>
                        <label htmlFor="permisDelivranceLieu" className="block text-sm font-medium text-gray-700">Permis Délivré par/à</label>
                        <input
                            type="text"
                            id="permisDelivranceLieu"
                            value={permisDelivranceLieu}
                            onChange={(e) => setPermisDelivranceLieu(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <h4 className="text-lg font-semibold mb-2">Adresse</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="adresseRue" className="block text-sm font-medium text-gray-700">Rue</label>
                        <input
                            type="text"
                            id="adresseRue"
                            value={adresseRue}
                            onChange={(e) => setAdresseRue(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="adresseCp" className="block text-sm font-medium text-gray-700">Code Postal</label>
                        <input
                            type="text"
                            id="adresseCp"
                            value={adresseCp}
                            onChange={(e) => setAdresseCp(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="adresseVille" className="block text-sm font-medium text-gray-700">Ville</label>
                        <input
                            type="text"
                            id="adresseVille"
                            value={adresseVille}
                            onChange={(e) => setAdresseVille(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`bg-green-600 text-white px-4 py-2 rounded shadow ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                    }`}
                >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </button>
            </form>

            <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <div className="flex-1">
                    <p className="font-medium mb-2">Photo de profil</p>
                    {chauffeur.photo_profil ? (
                        <img
                            src={chauffeur.photo_profil}
                            alt="Profil"
                            className="w-32 h-32 object-cover rounded mb-2 border"
                        />
                    ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                            <span className="text-gray-500">Aucune photo</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'photo_profil')}
                        disabled={uploadingPhoto === 'photo_profil'}
                        className="mb-2"
                    />
                    {uploadingPhoto === 'photo_profil' && <p>Upload en cours...</p>}
                </div>

                <div className="flex-1">
                    <p className="font-medium mb-2">Photo du permis</p>
                    {chauffeur.photo_permis ? (
                        <img
                            src={chauffeur.photo_permis}
                            alt="Permis"
                            className="w-32 h-32 object-cover rounded mb-2 border"
                        />
                    ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                            <span className="text-gray-500">Aucune photo</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'photo_permis')}
                        disabled={uploadingPhoto === 'photo_permis'}
                        className="mb-2"
                    />
                    {uploadingPhoto === 'photo_permis' && <p>Upload en cours...</p>}
                </div>
            </div>

            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <label className="font-medium block mb-2">Véhicule affecté :</label>
                <select
                    value={vehiculeId}
                    onChange={e => setVehiculeId(e.target.value)}
                    className="border px-3 py-2 rounded mb-4 w-full max-w-md"
                >
                    <option value="">Aucun véhicule</option>
                    {vehicules.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.plaque} - {v.modele}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleVehiculeChange}
                    disabled={updatingVehicle}
                    className={`bg-blue-600 text-white px-4 py-2 rounded ${
                        updatingVehicle ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                >
                    {updatingVehicle ? 'Mise à jour...' : 'Mettre à jour le véhicule'}
                </button>
            </div>
        </div>
    );
}