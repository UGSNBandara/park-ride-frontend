import React from 'react'
import './Dashboard.css'
import LineChart from './LineChart'
import LoadingDots from './LoadingDots'

const formatCurrency = (v: number) => {
  return v?.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

  const TIMEZONE = 'Asia/Colombo'

  const makeLast7Labels = () => {
    const labels: string[] = []
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: TIMEZONE })
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(fmt.format(d))
    }
    return labels
  }

const IncomeDashboard: React.FC = () => {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [last7, setLast7] = React.useState<number[] | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true); setError(null)
    // fetch overall payments summary and last-7 days data separately
    Promise.all([
      fetch('http://localhost:3000/payments').then(r => r.json()).catch(() => null),
      fetch('http://localhost:3000/payments/last-7-days').then(r => r.json()).catch(() => null),
    ])
      .then(([summary, last7Resp]) => {
        if (!mounted) return
        setData(summary)
        if (last7Resp && Array.isArray(last7Resp.days)) {
          // Build a guaranteed 7-day chronological sequence ending at the latest returned day
          const returned = last7Resp.days.slice()
          // find the last date in returned (prefer last element), fallback to today
          const lastReturned = returned.length ? returned[returned.length - 1].date : new Date().toISOString().slice(0, 10)
          const endDate = new Date(lastReturned)
          // start date is 6 days before endDate
          const startDate = new Date(endDate)
          startDate.setDate(endDate.getDate() - 6)

          const seq: Array<{ date: string; displayDate: string; total: number; count: number }> = []
          // use UTC arithmetic so sequence is stable regardless of runtime timezone
          const y = startDate.getUTCFullYear(), m = startDate.getUTCMonth(), d0 = startDate.getUTCDate()
          for (let i = 0; i < 7; i++) {
            const dt = new Date(Date.UTC(y, m, d0 + i))
            const iso = dt.toISOString().slice(0, 10)
            const found = returned.find((r: any) => {
              try { return (r.date || '').slice(0, 10) === iso } catch { return false }
            })
            // create a display date shifted forward by 1 day (UTC) per request
            const dispDt = new Date(Date.UTC(y, m, d0 + i + 1))
            const displayIso = dispDt.toISOString().slice(0, 10)
            seq.push({ date: iso, displayDate: displayIso, total: Number(found?.total ?? 0) || 0, count: Number(found?.count ?? 0) || 0 })
          }

          const nums = seq.map(s => s.total)
          setLast7(nums)
          setData((prev: any) => ({ ...(prev || {}), _last7_days: seq }))
        }
        setLoading(false)
      })
      .catch(err => { if (!mounted) return; setError(err?.message ?? 'Network error'); setLoading(false) })
    return () => { mounted = false }
  }, [])

  const daysLabels = React.useMemo(() => {
    const raw = data?._last7_days
    const wkFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: TIMEZONE })
    const mdFmt = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', timeZone: TIMEZONE })
    if (Array.isArray(raw) && raw.length > 0) return raw.map((d: any) => {
      try {
        // use the shifted displayDate for label formatting
        const dt = new Date((d.displayDate || d.date) + 'T00:00:00Z')
        const wk = wkFmt.format(dt)
        const md = mdFmt.format(dt)
        return `${wk} ${md}`
      } catch { return '' }
    })
    return makeLast7Labels()
  }, [data])

  return (
    <div className="rates-root">
      <h2 className="rates-title">Income Dashboard</h2>
  {loading && <div style={{padding:16,display:'flex',justifyContent:'center'}}><LoadingDots size={12} /></div>}
      {error && <div style={{padding:16,color:'#b00020'}}>{error}</div>}
      {data && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
            {['all','today','week','month'].map((k) => (
              <div key={k} className="feature" style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'1rem'}}>
                <div style={{fontSize:'.9rem',color:'#456',fontWeight:800,textTransform:'capitalize'}}>{k}</div>
                <div style={{fontSize:'1.6rem',fontWeight:900,color:'var(--blue)',marginTop:8}}>{formatCurrency(data[k]?.total ?? 0)}</div>
                <div style={{marginTop:6,fontSize:'.95rem',color:'#234'}}>{(data[k]?.count ?? 0) + ' transactions'}</div>
              </div>
            ))}
          </div>

          {/* Line chart for last 7 days */}
          <div style={{marginTop:16,background:'#fff',padding:12,borderRadius:10,border:'1px solid #eef6ff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:900,color:'var(--dark)'}}>Last 7 days</div>
              <div style={{color:'#456',fontSize:'.95rem'}}>Variation</div>
            </div>
            <div style={{marginTop:8}}>
              {last7 ? (
                <>
                  <LineChart data={last7} width={720} height={160} color={'#0b76ff'} />
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:'.85rem',color:'#556'}}>
                    {daysLabels.map((l, i) => <div key={i} style={{flex:1,textAlign:'center'}}>{l}</div>)}
                  </div>
                </>
              ) : (
                <div style={{padding:12,color:'#666'}}>No 7-day data available</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default IncomeDashboard
