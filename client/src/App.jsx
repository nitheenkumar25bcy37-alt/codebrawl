import { useState } from 'react'
import Landing from './pages/Landing'
import Lobby from './pages/Lobby'
import Waiting from './pages/Waiting'
import Battle from './pages/Battle'
import { useSocket } from './hooks/useSocket'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [user, setUser] = useState(null)
  const [room, setRoom] = useState(null)
  const socket = useSocket('http://localhost:3001')

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {screen === 'landing' && (
        <Landing socket={socket} setUser={setUser} setScreen={setScreen} />
      )}
      {screen === 'lobby' && (
        <Lobby socket={socket} user={user} setRoom={setRoom} setScreen={setScreen} />
      )}
      {screen === 'waiting' && (
        <Waiting socket={socket} user={user} room={room} setRoom={setRoom} setScreen={setScreen} />
      )}
      {screen === 'battle' && (
        <Battle socket={socket} user={user} room={room} setRoom={setRoom} setScreen={setScreen} />
      )}
    </div>
  )
}