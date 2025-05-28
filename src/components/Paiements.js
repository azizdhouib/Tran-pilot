// src/components/Paiements.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique filenames

export default function Paiements() {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [selectedChauffeurId, setSelectedChauffeurId] = useState('');
    const [selectedVehiculeId, setSelectedVehiculeId] = useState('');
    const [chauffeurs, setChauffeurs] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [payments, setPayments] = useState([]); // New state for saved payments
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loadingPayments, setLoadingPayments] = useState(true); // New state for loading saved payments
    const [user, setUser] = useState(null); // New state to store the current user


    // --- Fetching Chauffeurs, Vehicules, Payments, and User ---
    useEffect(() => {
        const fetchData = async () => {
            setError(null);
            setLoadingPayments(true);

            try {
                // Get current user session
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setUser(session.user); // Set the user state
                } else {
                    setError('Utilisateur non authentifié. Veuillez vous connecter.');
                    setLoadingPayments(false);
                    return;
                }

                // Fetch chauffeurs (RLS will automatically filter by user_id)
                const { data: chauffeursData, error: chauffeursError } = await supabase
                    .from('chauffeurs')
                    .select('id, prenom, nom')
                    .order('prenom', { ascending: true });
                if (chauffeursError) throw chauffeursError;
                setChauffeurs(chauffeursData);

                // Fetch vehicules (RLS will automatically filter by user_id)
                const { data: vehiculesData, error: vehiculesError } = await supabase
                    .from('vehicules')
                    .select('id, plaque, modele')
                    .order('plaque', { ascending: true });
                if (vehiculesError) throw vehiculesError;
                setVehicules(vehiculesData);

                // Fetch payments (RLS will automatically filter by user_id)
                const { data: paymentsData, error: paymentsError } = await supabase
                    .from('payments')
                    .select(`
                        id,
                        image_url,
                        created_at,
                        chauffeur_id,
                        vehicule_id,
                        chauffeurs (prenom, nom),
                        vehicules (plaque, modele)
                    `)
                    .order('created_at', { ascending: false }); // Show newest first

                if (paymentsError) throw paymentsError;
                setPayments(paymentsData);


            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Impossible de charger les données (chauffeurs, véhicules ou paiements).');
            } finally {
                setLoadingPayments(false);
            }
        };

        fetchData();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!user) { // Ensure user is available before proceeding
            setError('Utilisateur non authentifié. Veuillez vous connecter.');
            setLoading(false);
            return;
        }

        if (!imageFile) {
            setError('Veuillez sélectionner un fichier image.');
            setLoading(false);
            return;
        }

        if (!selectedChauffeurId && !selectedVehiculeId) {
            setError('Veuillez sélectionner au moins un chauffeur ou un véhicule.');
            setLoading(false);
            return;
        }

        try {
            const fileExtension = imageFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            // If you want user-specific storage paths: `receipts/${user.id}/${fileName}`
            // For now, keeping your existing path structure:
            const filePath = `receipts/${fileName}`;

            // 1. Upload the image to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chauffeur-media')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            const imageUrl = `${supabase.supabaseUrl}/storage/v1/object/public/chauffeur-media/${filePath}`;

            // 2. Insert a record into the 'payments' table, INCLUDING user_id
            const { error: insertError } = await supabase.from('payments').insert([
                {
                    image_url: imageUrl,
                    chauffeur_id: selectedChauffeurId || null,
                    vehicule_id: selectedVehiculeId || null,
                    user_id: user.id, // <--- IMPORTANT: Add the current user's ID
                },
            ]);

            if (insertError) {
                // If DB insert fails, try to remove the uploaded file
                await supabase.storage.from('chauffeur-media').remove([filePath]);
                throw insertError;
            }

            setSuccessMessage('Reçu téléchargé et associé avec succès !');

            // Re-fetch payments after successful upload (RLS will filter automatically)
            const { data: updatedPayments, error: fetchError } = await supabase
                .from('payments')
                .select(`
                    id,
                    image_url,
                    created_at,
                    chauffeur_id,
                    vehicule_id,
                    chauffeurs (prenom, nom),
                    vehicules (plaque, modele)
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setPayments(updatedPayments);

            // Reset form
            setImageFile(null);
            setImagePreviewUrl(null);
            setSelectedChauffeurId('');
            setSelectedVehiculeId('');

        } catch (err) {
            console.error('Error uploading receipt:', err);
            setError(`Erreur lors du téléchargement du reçu : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of the component's JSX) ...
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Gestion des Paiements</h1>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Télécharger un Nouveau Reçu</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

                <div className="mb-4">
                    <label htmlFor="imageUpload" className="block text-gray-700 text-sm font-bold mb-2">
                        Image du Reçu:
                    </label>
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    {imagePreviewUrl && (
                        <div className="mt-4">
                            <img src={imagePreviewUrl} alt="Aperçu du reçu" className="max-w-xs h-auto rounded shadow" />
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="chauffeurSelect" className="block text-gray-700 text-sm font-bold mb-2">
                        Chauffeur Associé:
                    </label>
                    <select
                        id="chauffeurSelect"
                        value={selectedChauffeurId}
                        onChange={(e) => setSelectedChauffeurId(e.target.value)}
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

                <div className="mb-6">
                    <label htmlFor="vehiculeSelect" className="block text-gray-700 text-sm font-bold mb-2">
                        Véhicule Associé:
                    </label>
                    <select
                        id="vehiculeSelect"
                        value={selectedVehiculeId}
                        onChange={(e) => setSelectedVehiculeId(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="">Sélectionner un véhicule</option>
                        {vehicules.map((vehicule) => (
                            <option key={vehicule.id} value={vehicule.id}>
                                {vehicule.plaque} ({vehicule.modele})
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                    {loading ? 'Téléchargement...' : 'Télécharger Reçu'}
                </button>
            </div>

            {/* --- Saved Payments Display Section --- */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Reçus Enregistrés</h2>
                {loadingPayments ? (
                    <p>Chargement des reçus...</p>
                ) : payments.length === 0 ? (
                    <p>Aucun reçu trouvé.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chauffeur</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <a href={payment.image_url} target="_blank" rel="noopener noreferrer">
                                            <img src={payment.image_url} alt="Reçu" className="w-16 h-auto rounded shadow-sm hover:opacity-75 transition-opacity" />
                                        </a>
                                    </td>
                                    <td className="px-4 py-4 text-gray-800 text-sm">
                                        {new Date(payment.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 text-gray-800 text-sm">
                                        {payment.chauffeurs ? `${payment.chauffeurs.prenom} ${payment.chauffeurs.nom}` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 text-gray-800 text-sm">
                                        {payment.vehicules ? `${payment.vehicules.plaque} (${payment.vehicules.modele})` : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* --- End Saved Payments Display Section --- */}
        </div>
    );
}