import { useState } from 'react'

export default function Landing({ socket, setUser, setScreen }) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState('signup')

  function enter() {
    if (!name.trim()) return alert('Enter a username!')
    socket.emit('register', { username: name.trim() })
    socket.once('registered', (userData) => {
      setUser(userData)
      setScreen('lobby')
    })
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.logo}>CODEBRAWL</div>
      <div style={styles.tagline}>// real-time coding battles · up to <span style={{color:'var(--accent)'}}>10 players</span> per room</div>

      <div style={styles.cards}>
        {[['⚔️','Live Battles','Up to 10 players'],['🏆','Leaderboard','ELO rankings'],['💻','Code Editor','C · Java · Python'],['⚡','Real-Time','See live progress']].map(([icon,title,sub])=>(
          <div key={title} style={styles.card}>
            <div style={{fontSize:'2rem'}}>{icon}</div>
            <div style={{fontWeight:700,margin:'0.4rem 0'}}>{title}</div>
            <div style={{fontSize:'0.8rem',color:'var(--text2)',fontFamily:'JetBrains Mono'}}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={styles.box}>
        <div style={styles.modalTitle}>// {mode === 'signup' ? 'CREATE ACCOUNT' : 'LOGIN'}</div>
        <input style={styles.input} placeholder="Enter username" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enter()} />
        <button style={styles.btnPrimary} onClick={enter}>🚀 Enter Arena</button>
        <div style={{marginTop:'1rem',fontSize:'0.8rem',color:'var(--text2)',fontFamily:'JetBrains Mono',textAlign:'center'}}>
          {mode==='signup'?'Have an account? ':'New here? '}
          <span style={{color:'var(--accent)',cursor:'pointer'}} onClick={()=>setMode(mode==='signup'?'login':'signup')}>
            {mode==='signup'?'Login':'Sign Up'}
          </span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'},
  logo:{fontFamily:'Orbitron',fontSize:'clamp(2.5rem,8vw,5rem)',fontWeight:900,background:'linear-gradient(135deg,#00f5ff,#ff3864)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 30px rgba(0,245,255,0.5))'},
  tagline:{fontFamily:'JetBrains Mono',fontSize:'0.95rem',color:'var(--text2)',margin:'1rem 0 2rem',letterSpacing:'0.1em'},
  cards:{display:'flex',gap:'1rem',flexWrap:'wrap',justifyContent:'center',marginBottom:'2.5rem'},
  card:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'1.25rem',width:'160px',transition:'all 0.3s'},
  box:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'16px',padding:'2rem',width:'100%',maxWidth:'400px'},
  modalTitle:{fontFamily:'Orbitron',fontSize:'1rem',color:'var(--accent)',marginBottom:'1.25rem',letterSpacing:'0.1em'},
  input:{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.75rem 1rem',color:'var(--text)',fontFamily:'JetBrains Mono',fontSize:'0.9rem',outline:'none',marginBottom:'1rem'},
  btnPrimary:{width:'100%',background:'linear-gradient(135deg,#00f5ff,#0099cc)',color:'#000',border:'none',borderRadius:'8px',padding:'0.85rem',fontFamily:'Orbitron',fontSize:'0.85rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.1em'},
}