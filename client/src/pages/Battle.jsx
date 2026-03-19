import { useEffect, useState, useRef } from 'react'
const PROBLEMS_BANK = {
  easy: {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    tags: ['Arrays', 'Hash Map'],
    constraints: '2 ≤ nums.length ≤ 10⁴'
  },
  medium: {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3' },
      { input: 's = "bbbbb"', output: '1' }
    ],
    tags: ['Sliding Window', 'String'],
    constraints: '0 ≤ s.length ≤ 5×10⁴'
  },
  hard: {
    title: 'Median of Two Sorted Arrays',
    description: 'Given two sorted arrays nums1 and nums2, return the median. Time complexity must be O(log(m+n)).',
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000' }
    ],
    tags: ['Binary Search', 'Divide & Conquer'],
    constraints: '0 ≤ m, n ≤ 1000'
  }
}
const TEMPLATES = {
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}`,
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `# Write your solution here\n\ndef solution():\n    pass`
}

export default function Battle({ socket, user, room, setRoom, setScreen }) {
  const [players, setPlayers] = useState(room?.players || [])
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState(TEMPLATES.c)
  const [lang, setLang] = useState('c')
  const [output, setOutput] = useState({ text: 'Ready to run...', type: 'pending' })
  const [seconds, setSeconds] = useState((room?.timeLimitMin || 15) * 60)
  const [chats, setChats] = useState([{ user: '⚡ SYSTEM', msg: 'Battle started! First correct answer wins. Good luck!' }])
  const [chatInput, setChatInput] = useState('')
  const [winner, setWinner] = useState(null)
  const chatRef = useRef(null)
  const codeRef = useRef(null)

  useEffect(() => {
    socket.on('battle_started', ({ room: r, problem: p }) => { setPlayers(r.players); setProblem(p) })
    socket.on('timer_tick', ({ secondsLeft }) => setSeconds(secondsLeft))
    socket.on('progress_updated', ({ players: pl }) => setPlayers(pl))
    socket.on('player_solved', ({ name, solveTime, room: r }) => {
      setPlayers(r.players)
      setChats(c => [...c, { user: '🏆 SYSTEM', msg: `${name} solved it in ${solveTime}!` }])
    })
    socket.on('battle_ended', ({ room: r }) => { setPlayers(r.players); setWinner(r) })
    socket.on('chat_message', ({ user: u, message }) => setChats(c => [...c, { user: u, msg: message }]))
    socket.on('player_left', ({ room: r }) => setPlayers(r.players))

    // Set problem from room if already started
const diff = room?.diff || 'medium'
setProblem(PROBLEMS_BANK[diff])

    return () => {
      socket.off('battle_started'); socket.off('timer_tick'); socket.off('progress_updated')
      socket.off('player_solved'); socket.off('battle_ended'); socket.off('chat_message'); socket.off('player_left')
    }
  }, [])

  useEffect(() => {
    socket.on('battle_started', ({ room: r, problem: p }) => { setPlayers(r.players); setProblem(p) })
    socket.on('timer_tick', ({ secondsLeft }) => setSeconds(secondsLeft))
    socket.on('progress_updated', ({ players: pl }) => setPlayers(pl))
    socket.on('player_solved', ({ name, solveTime, room: r }) => {
      setPlayers(r.players)
      setChats(c => [...c, { user: '🏆 SYSTEM', msg: `${name} solved it in ${solveTime}!` }])
    })
    socket.on('battle_ended', ({ room: r }) => { setPlayers(r.players); setWinner(r) })
    socket.on('chat_message', ({ user: u, message }) => setChats(c => [...c, { user: u, msg: message }]))
    socket.on('player_left', ({ room: r }) => setPlayers(r.players))
    socket.on('problem_data', (p) => setProblem(p))

    if (room?.problem) setProblem(room.problem)
    socket.emit('get_problem', { code: room.code })

    return () => {
      socket.off('battle_started'); socket.off('timer_tick'); socket.off('progress_updated')
      socket.off('player_solved'); socket.off('battle_ended'); socket.off('chat_message')
      socket.off('player_left'); socket.off('problem_data')
    }
  }, [])
  function setLangAndCode(l) { setLang(l); setCode(TEMPLATES[l]) }

  function handleCodeChange(e) {
    setCode(e.target.value)
    const progress = Math.min(Math.floor((e.target.value.length / 300) * 80), 90)
    socket.emit('update_progress', { code: room.code, progress, lang })
  }

  function runCode() {
    setOutput({ text: '⏳ Compiling...', type: 'pending' })
    setTimeout(() => {
      const pass = Math.random() > 0.35
      setOutput(pass
        ? { text: '✓ Test 1 passed\n✓ Test 2 passed\n\nAll sample tests passed! Try submitting.', type: 'success' }
        : { text: '✗ Test 1 failed\nExpected: correct answer\nGot: wrong answer\n\nCheck your logic.', type: 'error' }
      )
    }, 1200)
  }

  function submitCode() {
    setOutput({ text: '⏳ Submitting...', type: 'pending' })
    setTimeout(() => {
      const pass = Math.random() > 0.2
      if (pass) {
        setOutput({ text: '✓ All test cases passed!\n✓ Time: 2ms  Memory: 6MB\n\n🏆 +100 points!', type: 'success' })
        socket.emit('submit_solution', { code: room.code, passed: true })
      } else {
        setOutput({ text: '✗ Wrong answer on hidden test case.\nHint: Check edge cases.', type: 'error' })
      }
    }, 1800)
  }

  function sendChat() {
    if (!chatInput.trim()) return
    socket.emit('chat_message', { code: room.code, message: chatInput })
    setChatInput('')
  }

  const m = Math.floor(seconds / 60), sec = seconds % 60
  const timerStr = `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
  const timerColor = seconds <= 60 ? 'var(--accent2)' : seconds <= 180 ? 'var(--gold)' : 'var(--accent3)'
  const sorted = [...players].sort((a,b) => b.score - a.score)

  return (
    <div style={s.wrap}>
      {/* Winner Modal */}
      {winner && (
        <div style={s.winnerOverlay}>
          <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🏆</div>
          <div style={s.winnerTitle}>{sorted[0]?.name === user?.name ? 'YOU WIN!' : 'BATTLE OVER'}</div>
          <div style={s.winnerSub}>{sorted[0]?.name} wins!</div>
          <div style={s.finalBoard}>
            {sorted.map((p, i) => (
              <div key={p.name} style={s.finalRow}>
                <span style={{fontFamily:'Orbitron',fontSize:'1rem'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.'}</span>
                <span style={{flex:1,fontFamily:'JetBrains Mono'}}>{p.name}{p.name===user?.name?' (you)':''}</span>
                <span style={{color:'var(--text2)',fontFamily:'JetBrains Mono',fontSize:'0.75rem'}}>{p.solveTime||'—'}</span>
                <span style={{color:'var(--accent)',fontFamily:'Orbitron',fontWeight:700}}>{p.score}pts</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'1rem'}}>
            <button style={s.btnPrimary} onClick={()=>setScreen('lobby')}>🏠 Lobby</button>
            <button style={s.btnGhost} onClick={()=>{setWinner(null);setScreen('waiting')}}>🔄 Again</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div style={{fontFamily:'Orbitron',fontSize:'0.9rem',color:'var(--accent)'}}>⚔️ {room?.name}</div>
        <div style={{...s.timer, color: timerColor}}>{timerStr}</div>
        <button style={s.btnDanger} onClick={()=>setScreen('lobby')}>🏳️ Forfeit</button>
      </div>

      {/* Body */}
      <div style={s.body}>
        {/* Problem */}
        <div style={s.panel}>
          <div style={s.panelHeader}>📋 PROBLEM</div>
          <div style={{padding:'1rem',overflowY:'auto',flex:1}}>
            {problem ? <>
              <div style={{fontFamily:'Orbitron',fontSize:'1rem',marginBottom:'0.75rem'}}>{problem.title}</div>
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                {problem.tags?.map(t=><span key={t} style={s.tag}>{t}</span>)}
              </div>
              <div style={{fontSize:'0.9rem',lineHeight:1.7,marginBottom:'1rem'}}>{problem.description}</div>
              <div style={{fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--accent)',marginBottom:'0.5rem'}}>EXAMPLES</div>
              {problem.examples?.map((ex,i)=>(
                <div key={i} style={s.example}>
                  <div style={{color:'var(--text2)',fontSize:'0.7rem'}}>Example {i+1}</div>
                  <div><span style={{color:'var(--text2)'}}>Input: </span><span style={{color:'var(--accent3)'}}>{ex.input}</span></div>
                  <div><span style={{color:'var(--text2)'}}>Output: </span><span style={{color:'var(--accent3)'}}>{ex.output}</span></div>
                </div>
              ))}
              <div style={{fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--accent)',margin:'0.75rem 0 0.5rem'}}>CONSTRAINTS</div>
              <div style={s.example}>{problem.constraints}</div>
            </> : <div style={{color:'var(--text2)',fontFamily:'JetBrains Mono',fontSize:'0.85rem'}}>Loading problem...</div>}
          </div>
        </div>

        {/* Editor */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={s.toolbar}>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {['c','java','python'].map(l=>(
                <button key={l} style={{...s.langTab,...(lang===l?s.langTabActive:{})}} onClick={()=>setLangAndCode(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              <button style={s.btnGhost} onClick={runCode}>▶ Run</button>
              <button style={s.btnPrimary} onClick={submitCode}>⚡ Submit</button>
            </div>
          </div>
          <textarea ref={codeRef} style={s.editor} value={code} onChange={handleCodeChange} spellCheck={false} />
          <div style={s.output}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--text2)',marginBottom:'0.5rem'}}>OUTPUT</div>
            <pre style={{fontFamily:'JetBrains Mono',fontSize:'0.8rem',color: output.type==='success'?'var(--accent3)':output.type==='error'?'var(--accent2)':'var(--gold)', whiteSpace:'pre-wrap'}}>{output.text}</pre>
          </div>
        </div>

        {/* Players + Chat */}
        <div style={s.sidePanel}>
          <div style={s.panelHeader}>👥 SCOREBOARD</div>
          <div style={{padding:'0.75rem',overflowY:'auto',flex:1}}>
            {sorted.map((p, i) => (
              <div key={p.name} style={{...s.playerRow,...(p.name===user?.name?s.playerRowMe:{}),...(p.solved?s.playerRowSolved:{})}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.4rem'}}>
                  <span style={{fontFamily:'Orbitron',fontSize:'0.75rem',width:20,color:i===0?'var(--gold)':i===1?'var(--silver)':i===2?'var(--bronze)':'var(--text2)'}}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)}
                  </span>
                  <span style={{flex:1,fontFamily:'JetBrains Mono',fontSize:'0.78rem',fontWeight:600}}>{p.name}</span>
                  <span style={{fontFamily:'Orbitron',fontSize:'0.9rem',color:'var(--accent)',fontWeight:700}}>{p.score}</span>
                </div>
                <div style={{height:4,background:'var(--surface3)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${p.progress}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',transition:'width 0.5s'}}></div>
                </div>
                {p.solved && <div style={{fontFamily:'JetBrains Mono',fontSize:'0.65rem',color:'var(--accent3)',marginTop:'0.3rem'}}>⚡ {p.solveTime}</div>}
              </div>
            ))}
          </div>
          <div style={s.chat}>
            <div style={s.chatHeader}>💬 CHAT</div>
            <div ref={chatRef} style={s.chatMsgs}>
              {chats.map((c,i)=>(
                <div key={i} style={{fontFamily:'JetBrains Mono',fontSize:'0.72rem',marginBottom:'0.3rem'}}>
                  <span style={{color:c.user.includes('SYSTEM')?'var(--accent2)':'var(--accent)',fontWeight:600}}>{c.user}: </span>
                  <span style={{color:'var(--text)'}}>{c.msg}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',borderTop:'1px solid var(--border)',padding:'0.4rem',gap:'0.4rem'}}>
              <input style={{...s.chatInput}} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Message..." />
              <button style={{background:'var(--accent)',border:'none',borderRadius:6,padding:'0.4rem 0.75rem',color:'#000',fontFamily:'Orbitron',fontSize:'0.65rem',fontWeight:700,cursor:'pointer'}} onClick={sendChat}>GO</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap:{minHeight:'100vh',display:'flex',flexDirection:'column',background:'var(--bg)'},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 1.5rem',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0},
  timer:{fontFamily:'Orbitron',fontSize:'1.4rem',fontWeight:900,letterSpacing:'0.1em'},
  body:{display:'grid',gridTemplateColumns:'360px 1fr 250px',flex:1,overflow:'hidden',height:'calc(100vh - 57px)'},
  panel:{background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'},
  panelHeader:{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontFamily:'Orbitron',fontSize:'0.8rem',color:'var(--accent)',letterSpacing:'0.1em',flexShrink:0},
  toolbar:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.6rem 1rem',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0},
  langTab:{padding:'0.35rem 0.85rem',borderRadius:6,border:'1px solid var(--border)',background:'none',color:'var(--text2)',fontFamily:'JetBrains Mono',fontSize:'0.75rem',cursor:'pointer'},
  langTabActive:{background:'rgba(0,245,255,0.1)',borderColor:'var(--accent)',color:'var(--accent)'},
  editor:{flex:1,background:'#0d1117',fontFamily:'JetBrains Mono',fontSize:'0.85rem',color:'#e6edf3',border:'none',outline:'none',padding:'1rem',resize:'none',lineHeight:1.6,tabSize:4,minHeight:'300px'},
  output:{background:'var(--surface2)',borderTop:'1px solid var(--border)',padding:'0.75rem 1rem',flexShrink:0,maxHeight:'150px',overflowY:'auto'},
  sidePanel:{background:'var(--surface)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'},
  playerRow:{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'0.75rem',marginBottom:'0.6rem'},
  playerRowMe:{borderColor:'rgba(0,245,255,0.4)',background:'rgba(0,245,255,0.05)'},
  playerRowSolved:{borderColor:'rgba(57,255,20,0.4)',background:'rgba(57,255,20,0.05)'},
  chat:{borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'200px',flexShrink:0},
  chatHeader:{padding:'0.5rem 1rem',fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--text2)',borderBottom:'1px solid var(--border)'},
  chatMsgs:{flex:1,overflowY:'auto',padding:'0.5rem 0.75rem'},
  chatInput:{flex:1,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,padding:'0.4rem 0.6rem',color:'var(--text)',fontFamily:'JetBrains Mono',fontSize:'0.75rem',outline:'none'},
  tag:{fontSize:'0.65rem',fontFamily:'JetBrains Mono',padding:'0.2rem 0.5rem',borderRadius:4,background:'var(--surface3)',border:'1px solid var(--border)',color:'var(--text2)'},
  example:{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',fontFamily:'JetBrains Mono',fontSize:'0.8rem'},
  btnPrimary:{background:'linear-gradient(135deg,#00f5ff,#0099cc)',color:'#000',border:'none',borderRadius:8,padding:'0.5rem 1rem',fontFamily:'Orbitron',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'},
  btnGhost:{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'0.5rem 1rem',fontFamily:'Orbitron',fontSize:'0.75rem',color:'var(--text)',cursor:'pointer'},
  btnDanger:{background:'var(--accent2)',color:'#fff',border:'none',borderRadius:8,padding:'0.5rem 1rem',fontFamily:'Orbitron',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'},
  winnerOverlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',backdropFilter:'blur(12px)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'},
  winnerTitle:{fontFamily:'Orbitron',fontSize:'2.5rem',fontWeight:900,background:'linear-gradient(135deg,#ffd700,#ff3864)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:'0.5rem'},
  winnerSub:{fontFamily:'JetBrains Mono',fontSize:'1.2rem',color:'var(--accent)',marginBottom:'2rem'},
  finalBoard:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'1.5rem',minWidth:300,marginBottom:'2rem'},
  finalRow:{display:'flex',alignItems:'center',gap:'1rem',padding:'0.6rem 0',borderBottom:'1px solid var(--border)'},
}
