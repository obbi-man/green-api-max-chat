import { useState, type FormEvent } from 'react'
import { DEFAULT_API_URL, getStateInstance, type Credentials } from './api/greenApi'

export function Login({ onLogin, onDemo }: { onLogin: (c: Credentials) => void; onDemo: () => void }) {
  const [idInstance, setId] = useState('')
  const [apiTokenInstance, setToken] = useState('')
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const c = { apiUrl: apiUrl.trim(), idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() }
    setBusy(true)
    setError('')
    try {
      const { stateInstance } = await getStateInstance(c)
      if (stateInstance !== 'authorized') setError(`Инстанс не авторизован (${stateInstance})`)
      else onLogin(c)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="logo">MAX</div>
        <h1>Вход через GREEN-API</h1>
        <input placeholder="idInstance" value={idInstance} onChange={(e) => setId(e.target.value)} required />
        <input placeholder="apiTokenInstance" type="password" value={apiTokenInstance} onChange={(e) => setToken(e.target.value)} required />
        <input placeholder="apiUrl" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button disabled={busy}>{busy ? 'Проверяю…' : 'Войти'}</button>
        <button type="button" className="secondary" onClick={onDemo}>Демо-режим (без аккаунта)</button>
      </form>
    </div>
  )
}
