import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Login } from '~/components/Login'
import { Messages } from '~/components/Messages'
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

