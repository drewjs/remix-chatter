import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useLoaderData, useOutletContext } from '@remix-run/react'
import { useEffect, useState } from 'react'
import type { Database } from 'db-types'
import type { OutletContext } from '~/root'
import { createServerSupabase } from '~/supabase.server'

export async function action({ request }: ActionArgs) {
  const response = new Response()
  const supabase = createServerSupabase({ request, response })

  const formData = await request.formData()

  const { error } = await supabase.from('messages').insert([
    {
      content: String(formData.get('content')),
    },
  ])

  if (error) {
    console.error(error)
  }

  return json(null, { headers: response.headers })
}

export async function loader({ request }: LoaderArgs) {
  const response = new Response()
  const supabase = createServerSupabase({ request, response })

  const { data } = await supabase.from('messages').select('*')

  return json({ messages: data ?? [] }, { headers: response.headers })
}

export default function Index() {
  const { messages } = useLoaderData<typeof loader>()

  return (
    <div>
      <Login />
      <h1>Messages</h1>
      <Messages initialMessages={messages} />
      <Form method="post">
        <input name="content" />
        <button type="submit">Send</button>
      </Form>
    </div>
  )
}

type Message = Database['public']['Tables']['messages']['Row']

function Messages({ initialMessages }: { initialMessages: Message[] }) {
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

function Login() {
  const { supabase } = useOutletContext<OutletContext>()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })

    if (error) {
      console.error(error)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Login with GitHub</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
