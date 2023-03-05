import type { LoaderArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from '@remix-run/react'
import { createBrowserClient } from '@supabase/auth-helpers-remix'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import type { Database } from 'types/database'
import { createServerSupabase } from '~/supabase.server'

export type OutletContext = {
  supabase: SupabaseClient<Database>
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Chatter',
  viewport: 'width=device-width,initial-scale=1',
})

export async function loader({ request }: LoaderArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  }

  const response = new Response()
  const supabase = createServerSupabase({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return json({ env, session }, { headers: response.headers })
}

export default function App() {
  const { env, session } = useLoaderData<typeof loader>()
  const revalidator = useRevalidator()

  const [supabase] = useState(() =>
    createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY),
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, clientSession) => {
      if (clientSession?.access_token !== session?.access_token) {
        revalidator.revalidate()
      }
    })

    return () => subscription.unsubscribe()
  }, [revalidator, session?.access_token, supabase])

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet context={{ supabase }} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
