import { useEffect } from 'react'

export default function Waiting({ socket, user, room, setRoom, setScreen }) {
  useEffect(() => {
    socket.on('player_joined', ({ room: r }) => setRoom(r))
    socket.on('player_left', ({ room: r }) => setRoom(r))
    socket.on('battle_started', ({ room: r }) => { setRoom(r); setScreen('battle') })
    socket.on('error', alert)
    return () => { socket.off('player_joined'); socket.off('player_left'); socket.off('battle_started'); socket.off('error') }
  }, [])

  function start() { socket.emit('start_battle', { code: room.code }) }
  function leave() { socket.emit('leave_room', { code: room.code }); setScreen('lobby') }
  function copy() { navigator.clipboard?.writeText(room.code); alert('Copied: ' + room.code) }

  const isHost = room?.players?.[0]?.name === user?.name

  return (
    <div style={s.wrap}>
      <div style={s.title}>⚔️ {room?.name}</div>
      <div style={s.codeBox}>
        <div>
          <div style={{fontSize:'0.7rem',color:'var(--text2)',fontFamily:'JetBrains Mono'}}>ROOM CODE</div>
          <div style={{fontSize:'1.4rem',color:'var(--accent)',fontFamily:'JetBrains Mono',fontWeight:700,letterSpacing:'0.3em'}}>{room?.code}</div>
        </div>
        <button style={s.btnGhost} onClick={copy}>📋 Copy</button>
      </div>
      <div style={{fontFamily:'JetBrains Mono',fontSize:'0.85rem',color:'var(--text2)',marginBottom:'1.5rem'}}>
        <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'var(--accent)',marginRight:'0.5rem',animation:'pulse 1.5s infinite'}}></span>
        Waiting... ({room?.players?.length}/{room?.maxPlayers})
      </div>
      <div style={s.playersGrid}>
        {Array.from({length: room?.maxPlayers || 10}).map((_, i) => {
          const p = room?.players?.[i]
          return (
            <div key={i} style={{...s.playerCard, ...(p ? s.playerCardJoined : s.playerCardEmpty)}}>
              <div style={s.avatar}>{p ? p.name[0].toUpperCase() : '?'}</div>
              <div style={{fontFamily:'JetBrains Mono',fontSize:'0.8rem'}}>{p ? p.name : 'Open slot'}</div>
              {p && <div style={{fontSize:'0.65rem',color:'var(--accent3)',marginTop:'0.2rem'}}>✓ Ready</div>}
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
        {isHost && <button style={s.btnPrimary} onClick={start}>⚔️ Start Battle</button>}
        <button style={s.btnGhost} onClick={leave}>Leave Room</button>
      </div>
      {isHost && <div style={{marginTop:'1rem',fontSize:'0.75rem',color:'var(--text2)',fontFamily:'JetBrains Mono'}}>You are the host · need at least 2 players</div>}
    </div>
  )
}

const s = {
  wrap:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'},
  title:{fontFamily:'Orbitron',fontSize:'1.5rem',color:'var(--accent)',marginBottom:'1rem'},
  codeBox:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'0.75rem 1.5rem',display:'inline-flex',alignItems:'center',gap:'1.5rem',marginBottom:'1.5rem'},
  playersGrid:{display:'flex',gap:'0.75rem',flexWrap:'wrap',justifyContent:'center'},
  playerCard:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'1rem 1.25rem',textAlign:'center',minWidth:'110px',transition:'all 0.3s'},
  playerCardJoined:{borderColor:'rgba(57,255,20,0.4)',background:'rgba(57,255,20,0.05)'},
  playerCardEmpty:{opacity:0.4,borderStyle:'dashed'},
  avatar:{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#00f5ff,#ff3864)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1rem',color:'#000',margin:'0 auto 0.5rem'},
  btnPrimary:{background:'linear-gradient(135deg,#00f5ff,#0099cc)',color:'#000',border:'none',borderRadius:'8px',padding:'0.85rem 2rem',fontFamily:'Orbitron',fontSize:'0.85rem',fontWeight:700,cursor:'pointer'},
  btnGhost:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.85rem 2rem',fontFamily:'Orbitron',fontSize:'0.85rem',color:'var(--text)',cursor:'pointer'},
}