'use client'

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { httpBatchStreamLink, loggerLink, TRPCClientError } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'
import { useState } from 'react'
import SuperJSON from 'superjson'

import { type AppRouter } from '~/server/api/root'
import { createQueryClient } from './query-client'

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient()

  return clientQueryClientSingleton
}

export const api = createTRPCReact<AppRouter>()

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: op => {
            if (op.direction === 'down' && op.result instanceof Error) {
              return !isAbortedRequest(op.result)
            }
            return process.env.NODE_ENV === 'development'
          }
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          fetch(url, init) {
            return fetch(url, { ...init, credentials: 'include' })
          },
          headers: () => {
            const headers = new Headers()
            headers.set('x-trpc-source', 'nextjs-react')
            return headers
          }
        })
      ]
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

/**
 * Aborted requests (component unmount, route change, polling stopped after
 * terminal status) bubble up through `httpBatchStreamLink` as errors. They
 * are not real failures — silencing them keeps the dev console signal high.
 */
function isAbortedRequest(error: Error): boolean {
  if (error.name === 'AbortError') return true
  const cause = (error as { cause?: unknown }).cause
  if (cause instanceof Error && cause.name === 'AbortError') return true
  if (error instanceof TRPCClientError) {
    const data = error.data as { code?: string } | null | undefined
    return data?.code === 'CLIENT_CLOSED_REQUEST'
  }
  return false
}
