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
    const [payments, setPayments] = useState([]); // State for saved payments
    const [loading, setLoading] = useState(false); // For form submission loading
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loadingPayments, setLoadingPayments] = useState(true); // For loading saved payments
    const [user, setUser] = useState(null); // State to store the current user
    const [deletingId, setDeletingId] = useState(null); // State to track which payment is being deleted

    // --- Function to fetch all data (chauffeurs, vehicules, payments) ---
    const fetchData = async () => {
        setError(null);
        setLoadingPayments(true);

        try {
            // Get current user session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                const userId = session.user.id;

                // Fetch chauffeurs, explicitly filtering by user_id
                const { data: chauffeursData, error: chauffeursError } = await supabase
                    .from('chauffeurs')
                    .select('id, prenom, nom')
                    .eq('user_id', userId)
                    .order('prenom', { ascending: true });
                if (chauffeursError) throw chauffeursError;
                setChauffeurs(chauffeursData);

                // Fetch vehicules, explicitly filtering by user_id
                const { data: vehiculesData, error: vehiculesError } = await supabase
                    .from('vehicules')
                    .select('id, plaque, modele')
                    .eq('user_id', userId)
                    .order('plaque', { ascending: true });
                if (vehiculesError) throw vehiculesError;
                setVehicules(vehiculesData);

                // Fetch payments (RLS will also filter, but ensure user is tied via `user_id` column)
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
                    .order('created_at', { ascending: false });

                if (paymentsError) throw paymentsError;
                setPayments(paymentsData);

            } else {
                setError('Utilisateur non authentifié. Veuillez vous connecter.');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Impossible de charger les données (chauffeurs, véhicules ou paiements).');
        } finally {
            setLoadingPayments(false);
        }
    };

    // --- Effect Hook to Fetch Data on Component Mount ---
    useEffect(() => {
        fetchData();
    }, []); // Empty dependency array means this runs once on mount

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

        if (!user) {
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
            const filePath = `receipts/${fileName}`;

            // 1. Upload the image to Supabase Storage
            const { error: uploadError } = await supabase.storage
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
                    user_id: user.id, // Add the current user's ID
                },
            ]);

            if (insertError) {
                // If DB insert fails, try to remove the uploaded file
                await supabase.storage.from('chauffeur-media').remove([filePath]);
                throw insertError;
            }

            setSuccessMessage('Reçu téléchargé et associé avec succès !');

            // Re-fetch all data to update the payments list
            await fetchData();

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

    // --- Function to handle payment deletion ---
    const handleDeletePayment = async (paymentId, imageUrl) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce reçu ? Cette action est irréversible.')) {
            return;
        }

        setDeletingId(paymentId); // Set the ID of the item being deleted
        setError(null);
        setSuccessMessage(null);

        try {
            // 1. Delete the record from the 'payments' table
            const { error: deleteError } = await supabase
                .from('payments')
                .delete()
                .eq('id', paymentId);

            if (deleteError) {
                throw deleteError;
            }

            // 2. Delete the associated image from Supabase Storage
            // Extract the path from the full image URL
            const urlParts = imageUrl.split('/');
            // The path usually starts after 'public/chauffeur-media/'
            const filePath = urlParts.slice(urlParts.indexOf('chauffeur-media') + 1).join('/');

            const { error: storageError } = await supabase.storage
                .from('chauffeur-media')
                .remove([filePath]);

            if (storageError) {
                // Log storage error but don't prevent DB deletion success
                console.error('Error deleting image from storage:', storageError.message);
                setSuccessMessage('Reçu supprimé de la base de données, mais l\'image n\'a pas pu être supprimée du stockage.');
            } else {
                setSuccessMessage('Reçu et image supprimés avec succès !');
            }

            // Update the state to remove the deleted payment without a full refetch
            setPayments(prevPayments => prevPayments.filter(payment => payment.id !== paymentId));

        } catch (err) {
            console.error('Error deleting payment:', err);
            setError(`Erreur lors de la suppression du reçu : ${err.message}`);
        } finally {
            setDeletingId(null); // Reset deleting state
        }
    };


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
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> {/* New column for actions */}
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
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => handleDeletePayment(payment.id, payment.image_url)}
                                            disabled={deletingId === payment.id} // Disable while deleting
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs sm:text-sm disabled:opacity-50"
                                        >
                                            {deletingId === payment.id ? 'Suppression...' : 'Supprimer'}
                                        </button>
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