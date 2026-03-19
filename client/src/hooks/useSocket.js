import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useSocket(url) {
  const socketRef = useRef(null)
  if (!socketRef.current) {
    socketRef.current = io('https://codebrawl-server.onrender.com', { autoConnect: true })
  }
  useEffect(() => {
    return () => socketRef.current?.disconnect()
  }, [])
  return socketRef.current
}