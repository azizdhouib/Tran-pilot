import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// (Optional) Register a font if you use special characters or want to customize
// Font.register({ family: 'Open Sans', fonts: [
//   { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
//   { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 }
// ]});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica', // Or 'Open Sans' if registered
        fontSize: 11,
        lineHeight: 1.5,
    },
    section: {
        marginBottom: 10,
    },
    header: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    address: {
        fontSize: 10,
    },
    rightAlign: {
        textAlign: 'right',
    },
    bold: {
        fontWeight: 'bold',
    },
    underline: {
        textDecoration: 'underline',
    },
    footer: {
        fontSize: 9,
        marginTop: 20,
        textAlign: 'center',
        color: 'grey',
    }
});

const ContestationPdfDocument = ({ amande, chauffeurDesignant, chauffeurDesigne }) => {
    const antaiAddress = {
        nom: 'OFFICIER DU MINISTÈRE PUBLIC',
        rue: 'CS 41101',
        cp: '41011',
        ville: 'BLOIS CEDEX', // Double-check the exact ANTAI address for driver designations
    };

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR');

    // Helper to format date if it's not null/empty
    const formatDateForPdf = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (e) {
            console.error("Invalid date string for PDF:", dateString, e);
            return dateString; // Return as is if invalid
        }
    };

    if (!chauffeurDesignant || !chauffeurDesigne || !amande) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <Text style={{ textAlign: 'center', color: 'red' }}>
                        Erreur : Informations manquantes pour générer la désignation.
                    </Text>
                </Page>
            </Document>
        );
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    {/* Sender (The manager / Vehicle owner) */}
                    <Text>{chauffeurDesignant.prenom} {chauffeurDesignant.nom}</Text>
                    <Text>{chauffeurDesignant.adresse_rue}</Text>
                    <Text>{chauffeurDesignant.adresse_cp} {chauffeurDesignant.adresse_ville}</Text>
                    <Text>En ma qualité de [Gérant / Représentant Légal] de la société [Nom de la Société si applicable]</Text>
                </View>

                <View style={[styles.section, styles.rightAlign]}>
                    {/* Recipient (Officier du Ministère Public) */}
                    <Text>{antaiAddress.nom}</Text>
                    <Text>{antaiAddress.rue}</Text>
                    <Text>{antaiAddress.cp} {antaiAddress.ville}</Text>
                </View>

                <View style={[styles.section, styles.rightAlign]}>
                    <Text>Fait à {chauffeurDesignant.adresse_ville}, le {formattedDate}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.header}>Objet : Désignation de conducteur - Avis de contravention n° [À compléter sur l'avis original]</Text>
                    <Text style={styles.header}>Concerne l'infraction du : {amande.date_infraction}</Text>
                </View>

                <View style={styles.section}>
                    <Text>Madame, Monsieur,</Text>
                    <Text style={{ marginBottom: 10 }}>
                        Je soussigné(e) {chauffeurDesignant.prenom} {chauffeurDesignant.nom}, [Gérant / Représentant Légal] de la société [Nom de la Société si applicable si le véhicule est au nom de la société], dont le siège social est situé à {chauffeurDesignant.adresse_rue}, {chauffeurDesignant.adresse_cp} {chauffeurDesignant.adresse_ville}.
                    </Text>
                    <Text style={{ marginBottom: 10 }}>
                        J'ai reçu un avis de contravention concernant le véhicule immatriculé **{amande.vehicule_plaque}**, pour une infraction de type **{amande.nature_infraction}**, constatée le **{amande.date_infraction}** à **{amande.lieu}**. Le montant de cette amende s'élève à **{amande.montant} €**.
                    </Text>
                    <Text style={{ marginBottom: 10 }}>
                        Conformément aux dispositions de l'Article L121-6 du Code de la route, je vous informe que le conducteur de ce véhicule au moment des faits n'était pas moi-même, mais :
                    </Text>

                    <View style={{ marginLeft: 20, marginBottom: 20 }}>
                        <Text style={styles.bold}>Nom : {chauffeurDesigne.nom}</Text>
                        <Text style={styles.bold}>Prénom : {chauffeurDesigne.prenom}</Text>
                        {/* NEW: Date de naissance */}
                        {chauffeurDesigne.date_naissance && <Text style={styles.bold}>Date de naissance : {formatDateForPdf(chauffeurDesigne.date_naissance)}</Text>}
                        {/* NEW: Lieu de naissance */}
                        {chauffeurDesigne.lieu_naissance && <Text style={styles.bold}>Lieu de naissance : {chauffeurDesigne.lieu_naissance}</Text>}
                        <Text style={styles.bold}>Adresse : {chauffeurDesigne.adresse_rue}</Text>
                        <Text style={styles.bold}>Code Postal : {chauffeurDesigne.adresse_cp}</Text>
                        <Text style={styles.bold}>Ville : {chauffeurDesigne.adresse_ville}</Text>
                        <Text style={styles.bold}>Numéro de permis de conduire : {chauffeurDesigne.permis_numero}</Text>
                        {/* NEW: Permis délivrance date */}
                        {chauffeurDesigne.permis_delivrance_date && <Text style={styles.bold}>Délivré le : {formatDateForPdf(chauffeurDesigne.permis_delivrance_date)}</Text>}
                        {/* NEW: Permis délivrance lieu */}
                        {chauffeurDesigne.permis_delivrance_lieu && <Text style={styles.bold}>Par : {chauffeurDesigne.permis_delivrance_lieu}</Text>}
                    </View>

                    <Text style={{ marginBottom: 10 }}>
                        Vous trouverez ci-joint la copie de l'avis de contravention original ainsi que, le cas échéant, toute pièce justificative utile (comme une copie du permis de conduire du conducteur désigné si demandé).
                    </Text>
                    <Text style={{ marginBottom: 10 }}>
                        Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
                    </Text>
                </View>

                <View style={[styles.section, { marginTop: 40 }]}>
                    <Text>Signature du déclarant (le gérant/propriétaire) :</Text>
                    <Text>{chauffeurDesignant.prenom} {chauffeurDesignant.nom}</Text>
                </View>

                <View style={styles.footer} fixed>
                    <Text>Document généré le {formattedDate} - Pour toute question, consulter le site ANTAI.gouv.fr</Text>
                </View>
            </Page>
        </Document>
    );
};

export default ContestationPdfDocument;