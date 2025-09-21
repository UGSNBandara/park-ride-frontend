import React from 'react'
import './VehicleOut.css'
import LoadingDots from './LoadingDots'

// fixed subtype options and emojis (keep in sync with VehicleIn)
const FIXED_SUBTYPES: { label: string; price: number; icon: string }[] = [
  { label: 'Motor Car', price: 50, icon: '🚗' },
  { label: 'Three Wheel', price: 30, icon: '🛺' },
  { label: 'Dual Purpose', price: 70, icon: '🚚' },
  { label: 'Heavy Vehicle', price: 100, icon: '🚚' },
  { label: 'Motor Bike', price: 30, icon: '🏍️' },
  { label: 'Foot Bikes', price: 20, icon: '🚲' },
]

type OutVehicle = {
  id: string
  type: 'A'|'B'|'C'
  number: string
  inTime?: string
  outTime: string
  date: string // ISO date for filtering (exit_time)
  ticketId?: string
  officerId?: string
  entryIso?: string
  exitIso?: string
  subtype?: string
  amount?: number
  slot?: string | null
  rate?: number
}

// helper to categorize subtype to slot type A/B/C
const subtypeToSlotTypeChar = (name?: string): 'A'|'B'|'C' => {
  if (!name) return 'B'
  const n = name.toLowerCase()
  if (n.includes('heavy')) return 'A'
  if (n.includes('motor bike') || n.includes('foot') || n.includes('bicycle') || n.includes('bike')) return 'C'
  // Motor Car, Three Wheel, Dual Purpose → B
  return 'B'
}

const fmtTime = (v?: any) => {
  if (!v) return undefined
  try { return new Date(v).toLocaleTimeString() } catch { return String(v) }
}

const hoursBetween = (a?: string, b?: string) => {
  if (!a || !b) return 0
  const ms = new Date(b).getTime() - new Date(a).getTime()
  if (!isFinite(ms)) return 0
  return Math.max(0, +(ms / 3600000).toFixed(2))
}

const VehicleOut: React.FC = () => {
  const [records, setRecords] = React.useState<OutVehicle[]>([])
  const [loading, setLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [filterType, setFilterType] = React.useState<'ALL'|'A'|'B'|'C'>('ALL')
  const [range, setRange] = React.useState<'all'|'today'|'1w'|'1m'>('all')
  const [q, setQ] = React.useState('')
  const [slipModalVisible, setSlipModalVisible] = React.useState(false)
  const [slipData, setSlipData] = React.useState<any | null>(null)

  const now = new Date()
  const inRange = (isoDate: string) => {
    const d = new Date(isoDate)
    const diff = now.getTime() - d.getTime()
    const days = diff / (1000*60*60*24)
    if (range === 'today') return d.toDateString() === now.toDateString()
    if (range === '1w') return days <= 7
    if (range === '1m') return days <= 31
    return true
  }

  // fetch exited vehicles
  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        // build url according to selected range
  const base = 'http://localhost:3000/tickets/vehicles-exited'
  const q = range === 'today' ? '?range=today' : range === '1w' ? '?range=week' : range === '1m' ? '?range=month' : ''
        const res = await fetch(base + q)
        if (!res.ok) throw new Error('Failed to fetch exited vehicles')
        const data = await res.json()
        if (mounted && Array.isArray(data)) {
          const parsed: OutVehicle[] = data.map((it: any) => {
            const vt = it.vehicle_type ?? it.vehicleType ?? null
            const subtype = typeof vt === 'string' ? vt : (vt?.type ?? vt?.name)
            const typeChar = subtypeToSlotTypeChar(subtype)
            const entryIso = it.entry_time ?? it.entryTime ?? undefined
            const exitIso = it.exit_time ?? it.exitTime ?? undefined
            return {
              id: String(it._id ?? it.ticket_id ?? it.id ?? Date.now()),
              type: (it.slot_type ?? it.slotType ?? typeChar) as ('A'|'B'|'C'),
              number: it.vehicle_id ?? it.vehicle_no ?? it.vehicleNumber ?? '',
              inTime: fmtTime(entryIso),
              outTime: fmtTime(exitIso) ?? '',
              date: exitIso ?? new Date().toISOString(),
              ticketId: it.ticket_id ?? it.ticketId ?? undefined,
              officerId: it.officer_id ?? it.officerId ?? undefined,
              entryIso,
              exitIso,
              subtype,
              amount: it.amount === undefined ? undefined : Number(it.amount),
              slot: it.slot_type ?? null,
              rate: vt && typeof vt === 'object' ? Number(vt.charge_per_hour ?? vt.charge ?? vt.price ?? 0) : undefined,
            }
          })
          setRecords(parsed)
        }
      } catch (err: any) {
        if (mounted) setFetchError(err?.message ?? 'Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [range])

  const openSlip = (r: OutVehicle) => {
    const slip = {
      ticket_id: r.ticketId,
      vehicle_id: r.number,
      officer_id: r.officerId,
      entry_time: r.entryIso,
      exit_time: r.exitIso,
      vehicle_type: { name: r.subtype, rate_per_hour: r.rate },
      slot_type: r.slot ?? r.type,
      hours: hoursBetween(r.entryIso, r.exitIso),
      amount: r.amount ?? 0,
    }
    setSlipData(slip)
    setSlipModalVisible(true)
  }

  const visible = records.filter(r => (filterType === 'ALL' ? true : r.type === filterType) && inRange(r.date) && r.number.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="vehicle-in-root">
      <div className="cat-row">
        <div className="cat-buttons">
          <button className={`cat-btn ${filterType === 'ALL' ? 'active' : ''}`} onClick={() => setFilterType('ALL')}>All</button>
          <button className={`cat-btn ${filterType === 'A' ? 'active' : ''}`} onClick={() => setFilterType('A')}>A</button>
          <button className={`cat-btn ${filterType === 'B' ? 'active' : ''}`} onClick={() => setFilterType('B')}>B</button>
          <button className={`cat-btn ${filterType === 'C' ? 'active' : ''}`} onClick={() => setFilterType('C')}>C</button>
        </div>
        <div className="cat-action">
          <select
            className="range-select"
            value={range}
            onChange={e => setRange(e.target.value as any)}
            aria-label="Filter exited vehicles by range"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
          </select>
        </div>
      </div>

      <div className="vehicle-in-controls">
        <input className="vehicle-search" placeholder="Search vehicle number" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="vehicle-list">
  {loading && <div style={{margin:12,display:'flex',justifyContent:'center'}}><LoadingDots size={12} /></div>}
  {fetchError && <div style={{color:'var(--danger)',margin:12}}>{fetchError}</div>}
        <div className="list-header">
          <div className="vehicle-icon"><div className="header-pill">Type</div></div>
          <div className="vehicle-number">Vehicle Number</div>
          <div className="vehicle-time">Out Time</div>
          <div className="vehicle-time">In Time</div>
          <div className="vehicle-action">Action</div>
        </div>
        {visible.map(r => (
          <div key={r.id} className="vehicle-row">
            <div className="vehicle-icon">{r.subtype ? (FIXED_SUBTYPES.find(s => s.label === r.subtype)?.icon ?? (r.type === 'A' ? '🚚' : r.type === 'B' ? '🚗' : '🏍️')) : (r.type === 'A' ? '🚚' : r.type === 'B' ? '🚗' : '🏍️')}</div>
            <div className="vehicle-number">{r.number}</div>
            <div className="vehicle-time">{r.outTime}</div>
            <div className="vehicle-time">{r.inTime ?? '-'}</div>
            <div className="vehicle-action"><button className="ticket-btn" onClick={() => openSlip(r)}>View Ticket</button></div>
          </div>
        ))}
        {visible.length === 0 && <div className="vehicle-empty">No records for selected range</div>}
      </div>

      {slipModalVisible && slipData && (
        <div className="modal-backdrop">
          <div className="modal slip-modal">
            <h3 style={{marginTop:0}}>Payment Slip</h3>
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

export default VehicleOut
