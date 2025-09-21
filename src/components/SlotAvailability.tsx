import React from 'react'

type Slots = {
  A: number // heavy
  B: number // car/van/3-wheel
  C: number // bike/bicycle
}

const SlotAvailability: React.FC<{slots?: Slots}> = ({ slots: initialSlots = {A: 8, B: 24, C: 40} }) => {
  const [slots, setSlots] = React.useState<Slots>(initialSlots)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:3000/slots/status')
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        // data expected as array [{code, available}]
        const parsed = data && Array.isArray(data) ? data.reduce((acc: any, cur: any) => {
          if (!cur) return acc
          const code = String(cur.code).toUpperCase()
          if (code === 'A' || code === 'B' || code === 'C') acc[code] = Number(cur.available ?? cur.capacity ?? 0)
          return acc
        }, {A: initialSlots.A, B: initialSlots.B, C: initialSlots.C}) : null
        if (mounted && parsed) setSlots(parsed)
      } catch (err) {
        // keep initial
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [initialSlots.A, initialSlots.B, initialSlots.C])

  return (
    <div className="slots-root">
      <h3 className="slots-title">Available Slots</h3>
      <div className="slots-grid">
        <div className="slot-card slot-a">
          <div className="slot-type">A</div>
          <div className="slot-desc">Heavy Vehicles</div>
          <div className="slot-count">{loading ? '...' : slots.A}</div>
        </div>
        <div className="slot-card slot-b">
          <div className="slot-type">B</div>
          <div className="slot-desc">Cars / Vans / 3-wheel</div>
          <div className="slot-count">{loading ? '...' : slots.B}</div>
        </div>
        <div className="slot-card slot-c">
          <div className="slot-type">C</div>
          <div className="slot-desc">Bikes / Bicycles</div>
          <div className="slot-count">{loading ? '...' : slots.C}</div>
        </div>
      </div>
    </div>
  )
}

export default SlotAvailability
