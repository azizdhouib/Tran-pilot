import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Vehicules() {
  const [vehicules, setVehicules] = useState([])
  const [plaque, setPlaque] = useState('')
  const [modele, setModele] = useState('')
  const [statut, setStatut] = useState('Disponible')
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchVehicules()
  }, [])

  async function fetchVehicules() {
    const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .order('created_at', { ascending: false })
    if (!error) setVehicules(data)
  }

  async function ajouterOuModifierVehicule(e) {
    e.preventDefault()
    if (isEditing && editId) {
      const { error } = await supabase
          .from('vehicules')
          .update({ plaque, modele, statut })
          .eq('id', editId)

      if (!error) {
        resetForm()
        fetchVehicules()
      } else {
        console.error('Error updating vehicle:', error);
        alert('Erreur lors de la modification du véhicule : ' + error.message);
      }
    } else {
      const { error } = await supabase
          .from('vehicules')
          .insert({ plaque, modele, statut })

      if (!error) {
        resetForm()
        fetchVehicules()
      } else {
        console.error('Error adding vehicle:', error);
        alert('Erreur lors de l\'ajout du véhicule : ' + error.message);
      }
    }
  }

  async function supprimerVehicule(id) {
    const confirmation = window.confirm('Supprimer ce véhicule ?')
    if (!confirmation) return
    try {
      const { error } = await supabase.from('vehicules').delete().eq('id', id)
      if (error) throw error;
      alert('Véhicule supprimé avec succès !');
      fetchVehicules();
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert('Erreur lors de la suppression du véhicule : ' + err.message);
    }
  }

  function modifierVehicule(vehicule) {
    setPlaque(vehicule.plaque)
    setModele(vehicule.modele)
    setStatut(vehicule.statut)
    setEditId(vehicule.id)
    setIsEditing(true)
  }

  function resetForm() {
    setPlaque('')
    setModele('')
    setStatut('Disponible')
    setEditId(null)
    setIsEditing(false)
  }

  return (
      <div className="p-4 md:p-6 bg-white rounded shadow mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Gestion des Véhicules</h2>

        <form onSubmit={ajouterOuModifierVehicule} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <input
              placeholder="Plaque"
              value={plaque}
              onChange={e => setPlaque(e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
              required
          />
          <input
              placeholder="Modèle"
              value={modele}
              onChange={e => setModele(e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
          />
          <select
              value={statut}
              onChange={e => setStatut(e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
          >
            <option>Disponible</option>
            <option>En panne</option>
          </select>
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3 mt-2">
            <button
                type="submit"
                className={`${
                    isEditing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium px-4 py-2 rounded-md shadow w-full sm:w-auto`}
            >
              {isEditing ? 'Modifier véhicule' : '+ Nouveau véhicule'}
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
              <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Plaque</th>
              <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Modèle</th>
              <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Statut</th>
              <th className="py-2 px-2 sm:px-4 border text-left text-xs sm:text-sm">Actions</th>
            </tr>
            </thead>
            <tbody>
            {vehicules.map(v => (
                <tr key={v.id}>
                  <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{v.plaque}</td>
                  <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">{v.modele}</td>
                  <td className="border px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-base">
                  <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                          v.statut === 'Disponible'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {v.statut}
                  </span>
                  </td>
                  <td className="border px-2 py-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <button
                        onClick={() => modifierVehicule(v)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                    >
                      Modifier
                    </button>
                    <button
                        onClick={() => supprimerVehicule(v.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm w-full"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
  )
}