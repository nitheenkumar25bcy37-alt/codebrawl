import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useSocket(url) {
  const socketRef = useRef(null)
  if (!socketRef.current) {
    socketRef.current = io(url, { autoConnect: true })
  }
  useEffect(() => {
    return () => socketRef.current?.disconnect()
  }, [])
  return socketRef.current
}