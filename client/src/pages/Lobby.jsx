import { useEffect, useState } from 'react'

export default function Lobby({ socket, user, setRoom, setScreen }) {
  const [rooms, setRooms] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name:'', maxPlayers:10, diff:'medium', timeLimitMin:15, visibility:'public' })

  useEffect(() => {
    socket.emit('get_rooms')
    socket.on('room_list', setRooms)
    socket.on('room_created', (room) => { setRoom(room); setScreen('waiting') })
    socket.on('player_joined', ({ room }) => { setRoom(room); setScreen('waiting') })
    socket.on('error', (msg) => alert(msg))
    return () => { socket.off('room_list'); socket.off('room_created'); socket.off('player_joined'); socket.off('error') }
  }, [])

  function createRoom() {
    if (!form.name.trim()) return alert('Enter a room name')
    socket.emit('create_room', { ...form, maxPlayers: parseInt(form.maxPlayers), timeLimitMin: parseInt(form.timeLimitMin) })
    setShowCreate(false)
  }

  function joinRoom(code) {
    socket.emit('join_room', { code })
  }

  const diffColor = d => d==='easy'?'var(--accent3)':d==='medium'?'var(--gold)':'var(--accent2)'

  return (
    <div style={{minHeight:'100vh'}}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>CODEBRAWL</div>
        <button style={s.btnPrimary} onClick={()=>setShowCreate(!showCreate)}>+ Create Room</button>
        <div style={{fontFamily:'JetBrains Mono',fontSize:'0.85rem'}}>
          <span style={{color:'var(--accent)',fontWeight:700}}>{user?.name}</span>
          <span style={{color:'var(--gold)',marginLeft:'0.5rem'}}>★ {user?.rating} ELO</span>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreate && (
        <div style={s.createBox}>
          <div style={s.sectionTitle}>// CREATE ROOM</div>
          <div style={s.formRow}>
            <input style={s.input} placeholder="Room name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <select style={s.input} value={form.maxPlayers} onChange={e=>setForm({...form,maxPlayers:e.target.value})}>
              {[2,4,6,8,10].map(n=><option key={n} value={n}>{n} players</option>)}
            </select>
            <select style={s.input} value={form.diff} onChange={e=>setForm({...form,diff:e.target.value})}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
            <select style={s.input} value={form.timeLimitMin} onChange={e=>setForm({...form,timeLimitMin:e.target.value})}>
              {[10,15,20,30].map(n=><option key={n} value={n}>{n} min</option>)}
            </select>
            <button style={s.btnPrimary} onClick={createRoom}>⚔️ Create</button>
          </div>
        </div>
      )}

      <div style={s.body}>
        <div style={s.sectionTitle}>🔥 ACTIVE ROOMS</div>
        {rooms.length === 0 && <div style={{color:'var(--text2)',fontFamily:'JetBrains Mono',fontSize:'0.85rem',padding:'2rem'}}>No rooms yet — create one!</div>}
        <div style={s.grid}>
          {rooms.map(room => (
            <div key={room.code} style={s.roomCard}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                <div style={{fontFamily:'Orbitron',fontSize:'0.9rem',fontWeight:700}}>{room.name}</div>
                <span style={{...s.badge, color: room.status==='battle'?'var(--accent2)':'var(--accent)', borderColor: room.status==='battle'?'rgba(255,56,100,0.3)':'rgba(0,245,255,0.3)', background: room.status==='battle'?'rgba(255,56,100,0.1)':'rgba(0,245,255,0.1)'}}>
                  {room.status==='battle'?'⚔ BATTLE':'⏳ WAITING'}
                </span>
              </div>
              <div style={{display:'flex',gap:'1rem',fontSize:'0.78rem',color:'var(--text2)',fontFamily:'JetBrains Mono',marginBottom:'0.75rem'}}>
                <span>👥 {room.players.length}/{room.maxPlayers}</span>
                <span>⏱ {room.timeLimitMin}min</span>
                <span>🔑 {room.code}</span>
                <span style={{color:diffColor(room.diff)}}>◆ {room.diff.toUpperCase()}</span>
              </div>
              <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
                {room.players.map(p=>(
                  <span key={p.name} style={s.chip}>🟢 {p.name}</span>
                ))}
              </div>
              {room.status==='waiting' && room.players.length < room.maxPlayers && (
                <button style={{...s.btnPrimary,width:'100%',padding:'0.5rem'}} onClick={()=>joinRoom(room.code)}>Join →</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 2rem',background:'var(--surface)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:10},
  logo:{fontFamily:'Orbitron',fontSize:'1.2rem',fontWeight:900,background:'linear-gradient(135deg,#00f5ff,#ff3864)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  body:{padding:'1.5rem 2rem',maxWidth:'1200px',margin:'0 auto'},
  createBox:{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'1rem 2rem'},
  sectionTitle:{fontFamily:'Orbitron',fontSize:'0.85rem',color:'var(--accent)',letterSpacing:'0.15em',marginBottom:'1rem'},
  formRow:{display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1rem'},
  roomCard:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'1.25rem',transition:'all 0.25s'},
  badge:{fontFamily:'JetBrains Mono',fontSize:'0.65rem',padding:'0.2rem 0.6rem',borderRadius:'20px',border:'1px solid',fontWeight:600},
  chip:{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'20px',padding:'0.2rem 0.6rem',fontSize:'0.75rem',fontFamily:'JetBrains Mono'},
  input:{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.6rem 0.85rem',color:'var(--text)',fontFamily:'JetBrains Mono',fontSize:'0.85rem',outline:'none'},
  btnPrimary:{background:'linear-gradient(135deg,#00f5ff,#0099cc)',color:'#000',border:'none',borderRadius:'8px',padding:'0.6rem 1.25rem',fontFamily:'Orbitron',fontSize:'0.75rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.08em',whiteSpace:'nowrap'},
}