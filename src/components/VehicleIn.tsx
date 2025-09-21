import React from 'react'
import LoadingDots from './LoadingDots'

type Vehicle = {
  id: string
  type: 'A' | 'B' | 'C'
  number: string
  time: string
  subtype?: string
  rate?: number
  ticketId?: string
}

const initial: Vehicle[] = [
  { id: '1', type: 'C', number: 'BHH 0320', time: '09:28:23', subtype: 'Motor Bike', rate: 30 },
  { id: '2', type: 'B', number: 'CP - 1234', time: '09:15:00', subtype: 'Motor Car', rate: 50 },
  { id: '3', type: 'B', number: 'SP - 9012', time: '08:55:14', subtype: 'Three Wheel', rate: 30 },
  { id: '4', type: 'B', number: 'WP - 3456', time: '08:42:11', subtype: 'Dual Purpose', rate: 70 },
]

const VehicleIn: React.FC = () => {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(initial)
  const [loading, setLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<'ALL' | 'A' | 'B' | 'C'>('ALL')
  const [q, setQ] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)
  const [modalType, setModalType] = React.useState<'A'|'B'|'C'>('B')
  const [modalNum, setModalNum] = React.useState('')
  const [modalSubtype, setModalSubtype] = React.useState<string>(() => 'Motor Car')
  const [posting, setPosting] = React.useState(false)
  const [addError, setAddError] = React.useState<string | null>(null)

    // fixed subtype options and emojis (backend expects one of these labels)
    const FIXED_SUBTYPES: { label: string; price: number; icon: string }[] = [
      { label: 'Motor Car', price: 50, icon: '🚗' },
      { label: 'Three Wheel', price: 30, icon: '🛺' },
      { label: 'Dual Purpose', price: 70, icon: '🚚' },
      { label: 'Heavy Vehicle', price: 100, icon: '🚚' },
      { label: 'Motor Bike', price: 30, icon: '🏍️' },
      { label: 'Foot Bikes', price: 20, icon: '🚲' },
    ]

    // map types (A/B/C) to allowed subtype labels
    const subtypeMap: Record<string, { key: string; rate: number; icon: string }[]> = {
      A: FIXED_SUBTYPES.filter(s => s.label === 'Heavy Vehicle').map(s => ({ key: s.label, rate: s.price, icon: s.icon })),
      B: FIXED_SUBTYPES.filter(s => ['Motor Car', 'Three Wheel', 'Dual Purpose'].includes(s.label)).map(s => ({ key: s.label, rate: s.price, icon: s.icon })),
      C: FIXED_SUBTYPES.filter(s => ['Motor Bike', 'Foot Bikes'].includes(s.label)).map(s => ({ key: s.label, rate: s.price, icon: s.icon })),
    }

  const openAdd = (preferred?: 'A'|'B'|'C') => {
    const code = preferred || 'B'
    setModalType(code)
    // initialize subtype to the first option for the chosen type
    const first = subtypeMap[code][0]?.key ?? 'Motor Car'
    setModalSubtype(first)
    setModalNum('')
    setShowAdd(true)
  }

  // fetch vehicles currently in park from backend on mount
  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:3000/tickets/vehicles-in-park')
        if (!res.ok) throw new Error('Failed to fetch vehicles')
        const data = await res.json()
        // expect an array of objects with vehicle_id (number), vehicle_type, time, maybe subtype/rate
        if (Array.isArray(data) && mounted) {
          const parsed: Vehicle[] = data.map((it: any) => {
            // vehicle_type may be an object { type, charge_per_hour } or a string
            const vt = it.vehicle_type ?? it.vehicleType ?? it.type ?? null
            const subtype = typeof vt === 'string' ? vt : (vt && (vt.type ?? vt.name)) ?? (it.subtype ?? undefined)
            const rate = (vt && typeof vt === 'object') ? (vt.charge_per_hour ?? vt.charge ?? vt.price) : (it.charge_per_hour ?? it.rate ?? undefined)
            // prefer entry_time/entryTime iso fields returned by backend
            let timeVal = it.entry_time ?? it.entryTime ?? it.time ?? it.entered_at ?? null
            if (timeVal) {
              try { timeVal = new Date(timeVal).toLocaleTimeString() } catch { /* keep raw */ }
            } else {
              timeVal = new Date().toLocaleTimeString()
            }

            return {
              id: String(it._id ?? it.ticket_id ?? it.vehicle_id ?? it.id ?? Date.now()),
              type: (it.slot_type ?? it.slotType ?? it.slot ?? 'B') as ('A'|'B'|'C'),
              number: it.vehicle_id ?? it.number ?? it.vehicle_no ?? it.vehicleNumber ?? '',
              time: String(timeVal),
              subtype: subtype,
              rate: rate === undefined ? undefined : Number(rate),
              ticketId: it.ticket_id ?? it.ticketId ?? undefined,
            }
          })
          setVehicles(parsed)
        }
      } catch (err: any) {
        setFetchError(err?.message ?? 'Network error')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  // when modalType changes (user picks a different slot type), reset subtype to first allowed
  React.useEffect(() => {
    const first = subtypeMap[modalType][0]?.key ?? 'Motor Car'
    setModalSubtype(first)
  }, [modalType])

  const addVehicle = async () => {
    if (!modalNum.trim()) return
    setAddError(null)
    const subEntry = subtypeMap[modalType].find(s => s.key === modalSubtype) ?? subtypeMap[modalType][0]
    // determine officer_id from stored auth (profile or username)
    const officerId = (() => {
      try {
        const raw = localStorage.getItem('park_user')
        if (!raw) return 'unknown'
        const u = JSON.parse(raw)
        return u?.profile?.officer_id ?? u?.profile?._id ?? u?.profile?.id ?? u?.username ?? u?.profile?.admin_id ?? 'unknown'
      } catch { return 'unknown' }
    })()

    const payload = { vehicle_id: modalNum.trim(), vehicle_type: subEntry.key, officer_id: officerId }
    setPosting(true)
    try {
      const res = await fetch('http://localhost:3000/officer/vehicle-entry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAddError(body?.message || 'Failed to add vehicle')
        return
      }
      // on success use server values when provided
      const id = String(body.vehicle_id ?? body.id ?? payload.vehicle_id ?? Date.now())
      const time = body.time ?? body.entered_at ?? new Date().toLocaleTimeString()
  const v: Vehicle = { id, type: modalType, number: modalNum.trim(), time, subtype: subEntry.key, rate: subEntry.rate, ticketId: body.ticket_id ?? body.ticketId }
      setVehicles((s) => [v, ...s])
      setShowAdd(false)
    } catch (err: any) {
      setAddError(err?.message ?? 'Network error')
    } finally {
      setPosting(false)
    }
  }

  // ticket generation state per vehicle id
  const [generating, setGenerating] = React.useState<Record<string, boolean>>({})
  const [generatedTicket, setGeneratedTicket] = React.useState<Record<string, string>>({})
  const [generateError, setGenerateError] = React.useState<Record<string, string>>({})
  const [slipModalVisible, setSlipModalVisible] = React.useState(false)
  const [slipData, setSlipData] = React.useState<any | null>(null)
  const [slipIsFallback, setSlipIsFallback] = React.useState(false)

  const generateTicket = async (vehicle: Vehicle) => {
    // clear previous
    setGenerateError(s => ({ ...s, [vehicle.id]: '' }))
    setGeneratedTicket(s => ({ ...s, [vehicle.id]: '' }))
    setGenerating(s => ({ ...s, [vehicle.id]: true }))
    try {
      // reuse officer id extraction logic
      const officerId = (() => {
        try {
          const raw = localStorage.getItem('park_user')
          if (!raw) return 'unknown'
          const u = JSON.parse(raw)
          return u?.profile?.officer_id ?? u?.profile?._id ?? u?.profile?.id ?? u?.username ?? u?.profile?.admin_id ?? 'unknown'
        } catch { return 'unknown' }
      })()

      // Try to use a valid ticket id; if missing, we'll still open a fallback slip
      const ticketId = vehicle.ticketId || (typeof vehicle.id === 'string' && vehicle.id.startsWith('TICKET_') ? vehicle.id : '')

      let opened = false
      if (ticketId) {
        console.log(ticketId)
        const payload = { ticket_id: ticketId, officer_id: officerId }
        const res = await fetch('http://localhost:3000/payment/generate-slip', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        const body = await res.json().catch(() => ({}))
        if (res.ok && body?.slip) {
          const slip = body.slip
          const tid = String(slip.ticket_id ?? slip.ticketId ?? '')
          setGeneratedTicket(s => ({ ...s, [vehicle.id]: tid || 'generated' }))
          setSlipData(slip)
          setSlipIsFallback(false)
          setSlipModalVisible(true)
          // Remove this vehicle from the list on successful slip generation
          setVehicles(prev => prev.filter(it => it.id !== vehicle.id))
          opened = true
        } else {
          const msg = body?.message ?? 'Failed to generate slip from server'
          setGenerateError(s => ({ ...s, [vehicle.id]: msg }))
        }
      }

      if (!opened) {
        // Build a fallback slip and open modal anyway
        const fallbackTicketId = ticketId || `DRAFT_${vehicle.id}`
        const nowIso = new Date().toISOString()
        const fallback = {
          ticket_id: fallbackTicketId,
          vehicle_id: vehicle.number || vehicle.id,
          officer_id: officerId,
          entry_time: nowIso,
          exit_time: nowIso,
          vehicle_type: { name: vehicle.subtype ?? 'Unknown', rate_per_hour: vehicle.rate ?? 0 },
          slot_type: vehicle.type,
          hours: 0,
          amount: 0,
        }
        setSlipData(fallback)
        setSlipIsFallback(true)
        setSlipModalVisible(true)
      }
    } catch (err: any) {
      setGenerateError(s => ({ ...s, [vehicle.id]: err?.message ?? 'Network error' }))
    } finally {
      setGenerating(s => ({ ...s, [vehicle.id]: false }))
    }
  }

  const visible = vehicles.filter(v => (filter === 'ALL' ? true : v.type === filter) && v.number.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="vehicle-in-root">
      <div className="cat-row">
        <div className="cat-buttons">
          <button className={`cat-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
          <button className={`cat-btn ${filter === 'A' ? 'active' : ''}`} onClick={() => setFilter('A')}>A</button>
          <button className={`cat-btn ${filter === 'B' ? 'active' : ''}`} onClick={() => setFilter('B')}>B</button>
          <button className={`cat-btn ${filter === 'C' ? 'active' : ''}`} onClick={() => setFilter('C')}>C</button>
        </div>
        <div className="cat-action">
          <button className="add-btn" onClick={() => openAdd(filter === 'ALL' ? 'B' : filter as ('A'|'B'|'C'))}>Add Vehicle</button>
        </div>
      </div>

      <div className="vehicle-in-controls">
        <input className="vehicle-search" placeholder="Enter Vehicle Number" value={q} onChange={e => setQ(e.target.value)} />
      </div>

  {loading && <div style={{margin:12,display:'flex',justifyContent:'center'}}><LoadingDots size={12} /></div>}
  {fetchError && <div style={{color:'var(--danger)',margin:12}}>{fetchError}</div>}
      <div className="vehicle-list">
        <div className="list-header">
          <div className="vehicle-icon"><div className="header-pill">Type</div></div>
          <div className="vehicle-number">Vehicle Number</div>
          <div className="vehicle-time">In Time</div>
          <div className="vehicle-action">Action</div>
        </div>
        {visible.map(v => (
          <div key={v.id} className="vehicle-row">
              <div className="vehicle-icon">{v.subtype ? (FIXED_SUBTYPES.find(s => s.label === v.subtype)?.icon ?? (v.type === 'A' ? '🚚' : v.type === 'B' ? '🚗' : '🏍️')) : (v.type === 'A' ? '🚚' : v.type === 'B' ? '🚗' : '🏍️')}</div>
              <div className="vehicle-number">{v.number}</div>
              <div className="vehicle-time">{v.time}</div>
              <div className="vehicle-action">
                <button
                  className="ticket-btn"
                  title={generateError[v.id] ? generateError[v.id] : undefined}
                  onClick={() => generateTicket(v)}
                  disabled={posting || generating[v.id]}
                >
                  {generating[v.id] ? 'Generating...' : (generatedTicket[v.id] ? `Ticket: ${generatedTicket[v.id]}` : 'Generate Ticket')}
                </button>
              </div>
            </div>
        ))}
        {visible.length === 0 && <div className="vehicle-empty">No vehicles match</div>}
      </div>

      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal add-vehicle-modal">
            <h3 style={{marginTop:0}}>Add Vehicle</h3>

            <label>Type</label>
            <select value={modalType} onChange={e => setModalType(e.target.value as any)} className="add-type">
              <option value="A">A - Heavy Vehicle</option>
              <option value="B">B - Motor Car / Three Wheel / Dual Purpose</option>
              <option value="C">C - Motor Bike / Foot Bikes</option>
            </select>
            <label style={{marginTop:8}}>Subtype</label>
            <select className="add-type" value={modalSubtype} onChange={e => setModalSubtype(e.target.value)}>
              {subtypeMap[modalType].map(s => (
                <option key={s.key} value={s.key}>{s.icon} {s.key} — {s.rate}</option>
              ))}
            </select>

            <label style={{marginTop:8}}>Vehicle Number</label>
            <input value={modalNum} onChange={e => setModalNum(e.target.value)} className="add-input" />

            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button className="modal-secondary" onClick={() => setShowAdd(false)} disabled={posting}>Cancel</button>
              <button className="modal-primary" onClick={addVehicle} disabled={posting}>{posting ? 'Adding...' : 'Add'}</button>
            </div>
            {addError && <div className="modal-error">{addError}</div>}
          </div>
        </div>
      )}
      {slipModalVisible && slipData && (
        <div className="modal-backdrop">
          <div className="modal slip-modal">
            <h3 style={{marginTop:0}}>Payment Slip</h3>
            {slipIsFallback && (
              <div style={{marginBottom:8, padding:8, background:'#fff3cd', color:'#664d03', border:'1px solid #ffecb5', borderRadius:6}}>
                This is a local slip preview. Server slip could not be generated.
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><strong>Ticket ID</strong><div>{slipData.ticket_id}</div></div>
              <div><strong>Vehicle</strong><div>{slipData.vehicle_id}</div></div>
              <div><strong>Officer</strong><div>{slipData.officer_id}</div></div>
              <div><strong>Slot</strong><div>{slipData.slot_type}</div></div>
              <div><strong>Type</strong><div>{(slipData.vehicle_type && (slipData.vehicle_type.name ?? slipData.vehicle_type.type)) ?? ''}</div></div>
              <div><strong>Hours</strong><div>{String(slipData.hours ?? slipData.duration ?? '')}</div></div>
              <div style={{gridColumn:'1 / -1'}}><strong>Amount</strong><div style={{fontSize:18,fontWeight:700}}>{slipData.amount ?? slipData.total ?? ''}</div></div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
              <button className="modal-primary" onClick={() => { setSlipModalVisible(false); setSlipData(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleIn
