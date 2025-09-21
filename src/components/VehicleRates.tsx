import React from 'react'
import { useAuth } from './auth/AuthContext'
import SlotAvailability from './SlotAvailability'

type RateItem = { label: string; price: number }

const FALLBACK_RATES: RateItem[] = [
  { label: 'Motor Car', price: 50 },
  { label: 'Three Wheel', price: 30 },
  { label: 'Dual Purpose', price: 70 },
  { label: 'Heavy Vehicle', price: 100 },
  { label: 'Motor Bike', price: 30 },
  { label: 'Foot Bikes', price: 20 }
]

const emojiFor = (label: string) => {
  const s = label.toLowerCase()
  if (s.includes('motor car') || s.includes('car')) return '🚗'
  if (s.includes('motor bike') || s.includes('bike') || s.includes('motorbike')) return '🏍️'
  if (s.includes('three') || s.includes('three wheel') || s.includes('three-wheel') || s.includes('threewheel')) return '🛺'
  if (s.includes('heavy') || s.includes('truck')) return '🚚'
  if (s.includes('bus')) return '🚌'
  if (s.includes('foot') || s.includes('bicycle') || s.includes('cycle')) return '🚲'
  return '🚗'
}

const VehicleRates: React.FC = () => {
  const { user } = useAuth()
  const [rates, setRates] = React.useState<RateItem[]>(FALLBACK_RATES)
  const [loading, setLoading] = React.useState(false)
  const [editing, setEditing] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState<string>('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:3000/admin/vehicle-types')
        if (!res.ok) throw new Error('Fetch failed')
        const data = await res.json()
        // data could be an array or object; try common shapes
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.rates) ? data.rates : null)
        if (!list) {
          setLoading(false)
          return
        }
        const parsed: RateItem[] = list.map((it: any) => {
          const label = it.label ?? it.type ?? it.name ?? String(it[0] ?? '')
          const price = Number(it.charge_per_hour ?? it.charge ?? it.price ?? it.rate ?? it.cost ?? it.chargePerHour ?? 0)
          return { label: String(label), price: Number.isNaN(price) ? 0 : price }
        })
        if (mounted && parsed.length > 0) setRates(parsed)
      } catch (err) {
        // keep fallback
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const startEdit = (label: string, price: number) => {
    setError(null)
    setEditing(label)
    setEditValue(String(price))
  }

  const cancelEdit = () => { setEditing(null); setEditValue(''); setError(null) }

  const saveEdit = async (label: string) => {
    setError(null)
    const valueNum = Number(editValue)
    if (Number.isNaN(valueNum) || valueNum < 0) { setError('Enter a valid non-negative number'); return }
    setSaving(true)
    try {
      const res = await fetch('http://localhost:3000/admin/update-charge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: label, charge_per_hour: valueNum })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'Save failed')
      }
      // optimistic update
      setRates(rates.map(r => r.label === label ? { ...r, price: valueNum } : r))
      setEditing(null)
      setEditValue('')
    } catch (err: any) {
      setError(err?.message ?? 'Network error')
    } finally { setSaving(false) }
  }

  return (
    <div className="rates-root">
      <SlotAvailability />
      <h2 className="rates-title">Parking Rates (Per Hour)</h2>

      {loading ? <div>Loading rates...</div> : (
        <div className="rates-list">
          {rates.map((r) => (
            <div className="rates-row" key={r.label}>
              <div className="rates-left">
                <span className="rates-icon">{emojiFor(r.label)}</span>
                <span className="rates-label">{r.label}</span>
              </div>
              <div className="rates-right">
                <>
                  <span className="rates-price">{r.price.toFixed(2)}</span>
                  {user?.role === 'manager' && (
                    <button className="rates-edit" onClick={() => startEdit(r.label, r.price)}>✏️</button>
                  )}
                </>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="modal-error" style={{marginTop:8}}>{error}</div>}

      <div className="rates-note">More than 24 hours parking : 24 Hours Rate * Number Of Days</div>

      {editing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit Rate</h3>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); saveEdit(editing) }}>
              <label>
                Type
                <input className="add-input" value={editing} disabled />
              </label>
              <label>
                Charge Per Hour
                <input
                  className="add-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  autoFocus
                />
              </label>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                <button type="button" className="modal-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button type="submit" className="modal-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleRates
