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

    // --- Fetching Chauffeurs, Vehicules, and Payments ---
    useEffect(() => {
        const fetchData = async () => {
            setError(null);
            setLoadingPayments(true); // Start loading payments

            try {
                // Fetch chauffeurs
                const { data: chauffeursData, error: chauffeursError } = await supabase
                    .from('chauffeurs')
                    .select('id, prenom, nom')
                    .order('prenom', { ascending: true });

                if (chauffeursError) throw chauffeursError;
                setChauffeurs(chauffeursData);

                // Fetch vehicules
                const { data: vehiculesData, error: vehiculesError } = await supabase
                    .from('vehicules')
                    .select('id, plaque, modele')
                    .order('plaque', { ascending: true });

                if (vehiculesError) throw vehiculesError;
                setVehicules(vehiculesData);

                // Fetch payments
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
                setLoadingPayments(false); // Stop loading payments
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!imageFile) {
            setError('Veuillez sélectionner une image de reçu.');
            setLoading(false);
            return;
        }

        if (!selectedChauffeurId && !selectedVehiculeId) {
            setError('Veuillez sélectionner au moins un chauffeur ou un véhicule pour le reçu.');
            setLoading(false);
            return;
        }

        try {
            const fileExtension = imageFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const filePath = `receipts/${fileName}`;

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

            const { error: insertError } = await supabase.from('payments').insert([
                {
                    image_url: imageUrl,
                    chauffeur_id: selectedChauffeurId || null,
                    vehicule_id: selectedVehiculeId || null,
                },
            ]);

            if (insertError) {
                await supabase.storage.from('chauffeur-media').remove([filePath]); // Clean up storage
                throw insertError;
            }

            setSuccessMessage('Reçu téléchargé et associé avec succès !');

            // --- Re-fetch payments after successful upload ---
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
            // --- End Re-fetch ---

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

    return (
        <div className="p-4 md:p-6 bg-white rounded shadow mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Gestion des Paiements</h2>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{successMessage}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Payment Upload Form */}
            <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">Télécharger un nouveau reçu</h3>
                <div className="mb-4">
                    <label htmlFor="receipt-upload" className="block text-gray-700 text-sm font-bold mb-2">
                        Sélectionner un reçu (photo ou fichier):
                    </label>
                    <input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {imagePreviewUrl && (
                    <div className="mb-4">
                        <h4 className="text-md font-semibold mb-2">Aperçu de l'image:</h4>
                        <img src={imagePreviewUrl} alt="Aperçu du reçu" className="max-w-xs h-auto rounded shadow-md border border-gray-200" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="chauffeur-select" className="block text-gray-700 text-sm font-bold mb-2">
                            Associer à un chauffeur (optionnel):
                        </label>
                        <select
                            id="chauffeur-select"
                            value={selectedChauffeurId}
                            onChange={(e) => setSelectedChauffeurId(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="">Sélectionner un chauffeur</option>
                            {chauffeurs.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.prenom} {c.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="vehicule-select" className="block text-gray-700 text-sm font-bold mb-2">
                            Associer à un véhicule (optionnel):
                        </label>
                        <select
                            id="vehicule-select"
                            value={selectedVehiculeId}
                            onChange={(e) => setSelectedVehiculeId(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="">Sélectionner un véhicule</option>
                            {vehicules.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.plaque} ({v.modele})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={loading || !imageFile || (!selectedChauffeurId && !selectedVehiculeId)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Téléchargement...' : 'Télécharger et associer le reçu'}
                </button>
            </div>

            {/* --- Saved Payments Display Section --- */}
            <div className="mt-8 pt-4 border-t border-gray-200">
                <h3 className="text-xl font-bold mb-4">Reçus Enregistrés</h3>

                {loadingPayments ? (
                    <p className="text-center text-gray-600">Chargement des reçus...</p>
                ) : payments.length === 0 ? (
                    <p className="text-center text-gray-500">Aucun reçu enregistré pour le moment.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reçu</th>
                                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Chauffeur</th>
                                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Véhicule</th>
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