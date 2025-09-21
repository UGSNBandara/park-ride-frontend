import React from 'react'

const HomeContent: React.FC = () => {
  const parkImg = '/assets/park.png'
  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <h1 className="hero-title">Park & Ride</h1>
          <h2 className="hero-sub">Enjoy the Travel</h2>
          <button className="cta">Get Started</button>
        </div>
        <div className="hero-right">
          <img src={parkImg} alt="park" className="hero-image" />
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <span className="icon" aria-hidden>
            <svg width="20" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7" cy="17" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="17" r="1.5" fill="currentColor"/>
            </svg>
          </span>
          <span className="label">Easy Parking</span>
        </div>
        <div className="feature">
          <span className="icon" aria-hidden>
            <svg width="20" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 7h-3l-2-2H8L6 7H3v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
          <span className="label">CCTV Covered</span>
        </div>
        <div className="feature">
          <span className="icon" aria-hidden>
            <svg width="20" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="label">Open 24 /7</span>
        </div>
      </section>

      <h3 className="callout">Start Your Journey Now — Your Car's in Safe Hands</h3>
    </>
  )
}

export default HomeContent
