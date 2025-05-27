import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Affectations() {
  const [chauffeurs, setChauffeurs] = useState([])
  const [vehicules, setVehicules] = useState([])
  const [chauffeurId, setChauffeurId] = useState('')
  const [vehiculeId, setVehiculeId] = useState('')

  useEffect(() => {
    fetchChauffeurs()
    fetchVehicules()
  }, [])

  async function fetchChauffeurs() {
    const { data } = await supabase.from('chauffeurs').select('id, nom, vehicule_id, photo_profil')
    setChauffeurs(data || [])
  }

  async function fetchVehicules() {
    const { data } = await supabase.from('vehicules').select('*')
    setVehicules(data || [])
  }

  async function affecterVehicule(e) {
    e.preventDefault()
    if (!chauffeurId || !vehiculeId) return

    // 1. Affecter le véhicule au chauffeur
    await supabase
        .from('chauffeurs')
        .update({ vehicule_id: vehiculeId })
        .eq('id', chauffeurId)

    // 2. Marquer le véhicule comme indisponible
    await supabase
        .from('vehicules')
        .update({ statut: 'indisponible' })
        .eq('id', vehiculeId)

    setChauffeurId('')
    setVehiculeId('')
    fetchChauffeurs()
    fetchVehicules()
  }

  async function retirerAffectation(chauffeurId) {
    if (confirm('Retirer le véhicule de ce chauffeur ?')) {
      // 1. Récupérer l'ancien véhicule affecté
      const { data: chauffeur } = await supabase
          .from('chauffeurs')
          .select('vehicule_id')
          .eq('id', chauffeurId)
          .single()

      // 2. Enlever l'affectation du chauffeur
      await supabase
          .from('chauffeurs')
          .update({ vehicule_id: null })
          .eq('id', chauffeurId)

      // 3. Marquer le véhicule comme disponible (s'il y en avait un)
      if (chauffeur?.vehicule_id) {
        await supabase
            .from('vehicules')
            .update({ statut: 'Disponible' })
            .eq('id', chauffeur.vehicule_id)
      }

      fetchChauffeurs()
      fetchVehicules()
    }
  }

  return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Affecter un véhicule à un chauffeur</h2>

        <form onSubmit={affecterVehicule} className="flex flex-wrap gap-4 mb-6">
          <select value={chauffeurId} onChange={e => setChauffeurId(e.target.value)} required className="border p-2 rounded">
            <option value="">Sélectionner un chauffeur</option>
            {chauffeurs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.vehicule_id ? '(Déjà affecté)' : ''}
                </option>
            ))}
          </select>

          <select value={vehiculeId} onChange={e => setVehiculeId(e.target.value)} required className="border p-2 rounded">
            <option value="">Sélectionner un véhicule</option>
            {vehicules
                .filter(v => !chauffeurs.some(c => c.vehicule_id === v.id)) // Exclure véhicules déjà affectés
                .map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plaque} - {v.modele}
                    </option>
                ))}
          </select>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Affecter</button>
        </form>

        <h3 className="text-lg font-semibold mb-2">Affectations actuelles</h3>
        <div className="mb-4">
          <p className="text-lg font-semibold">
            Chauffeurs non affectés :{' '}
            <span className="text-red-600">
      {chauffeurs.filter(c => !c.vehicule_id).length}
    </span>
          </p>
        </div>

        <table className="min-w-full bg-white border">
          <thead>
          <tr>
            <th className="border px-4 py-2">Photo</th>
            <th className="border px-4 py-2">Nom</th>
            <th className="border px-4 py-2">Véhicule</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
          </thead>
          <tbody>
          {chauffeurs.map(c => {
            const vehicule = vehicules.find(v => v.id === c.vehicule_id)
            const ligneClasse = vehicule ? 'bg-green-100' : 'bg-red-100'

            return (
                <tr key={c.id} className={ligneClasse}>
                    <td className="border px-4 py-2 text-center">
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
                  <td className="border px-4 py-2">{c.nom}</td>
                  <td className="border px-4 py-2">
                    {vehicule ? vehicule.plaque : 'Aucun'}
                  </td>
                  <td className="border px-4 py-2">
                    {vehicule && (
                        <button
                            onClick={() => retirerAffectation(c.id)}
                            className="text-red-600 hover:underline"
                        >
                          Retirer
                        </button>
                    )}
                  </td>
                </tr>
            )
          })}
          </tbody>
        </table>
      </div>
  )
}
