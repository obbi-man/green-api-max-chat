import { useMemo, useState } from 'react'
import { createRealClient, type Credentials } from './api/greenApi'
import { createDemoClient } from './api/demoClient'
import { Login } from './Login'
import { Chat } from './Chat'

const KEY = 'green-api-creds'

function load(): Credentials | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(load)
  const [demo, setDemo] = useState(false)
  const client = useMemo(() => (demo ? createDemoClient() : creds ? createRealClient(creds) : null), [demo, creds])
  const logout = () => {
    sessionStorage.removeItem(KEY)
    setCreds(null)
    setDemo(false)
  }
  if (!client)
    return (
      <Login
        onDemo={() => setDemo(true)}
        onLogin={(c) => {
          sessionStorage.setItem(KEY, JSON.stringify(c))
          setCreds(c)
        }}
      />
    )
  return <Chat client={client} demo={demo} onLogout={logout} />
}
