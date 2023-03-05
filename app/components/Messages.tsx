import { useOutletContext } from '@remix-run/react'
import { useState, useEffect } from 'react'
import type { Database } from 'types/database'
import type { OutletContext } from '~/root'

type Message = Database['public']['Tables']['messages']['Row']

export type MessagesProps = { initialMessages: Message[] }

export function Messages({ initialMessages }: MessagesProps) {
  const [messages, setMessages] = useState(initialMessages)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const { supabase } = useOutletContext<OutletContext>()

  useEffect(() => {
    const channel = supabase
      .channel('*')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          console.log('payload', payload)
          const message = payload.new as Message

          if (!messages.find(m => m.id === message.id)) {
            setMessages(messages => [...messages, message])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messages, supabase, setMessages])

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <p>
            {message.content} - {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
