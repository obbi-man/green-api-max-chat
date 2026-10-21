import { useEffect, useRef, useState, type FormEvent } from 'react'
import { parseNotification, type GreenApiClient } from './api/greenApi'
import { chatIdToPhone, phoneToChatId } from './lib/phone'

interface Msg { id: string; text: string; outgoing: boolean; time: number }

export function Chat({ client, demo, onLogout }: { client: GreenApiClient; demo?: boolean; onLogout: () => void }) {
  const [chats, setChats] = useState<Record<string, Msg[]>>({})
  const [active, setActive] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  const chatsRef = useRef(chats)

  useEffect(() => {
    chatsRef.current = chats
  }, [chats])

  const addMsg = (chatId: string, m: Msg) =>
    setChats((prev) => {
      const list = prev[chatId] ?? []
      if (list.some((x) => x.id === m.id)) return prev
      return { ...prev, [chatId]: [...list, m] }
    })

  // MAX may report a numeric chatId; map it to an existing phone chat when possible
  function resolveChat(chatId: string, phone?: string) {
    const byPhone = phone ? `${phone}@c.us` : null
    if (byPhone && !chatsRef.current[chatId] && chatsRef.current[byPhone]) return byPhone
    return chatId
  }

  // Polling of HTTP API notifications queue
  useEffect(() => {
    let stop = false
    ;(async () => {
      while (!stop) {
        try {
          const n = await client.receiveNotification(5)
          if (!n) continue
          const m = parseNotification(n)
          if (m) addMsg(resolveChat(m.chatId, m.senderPhone), { id: m.idMessage, text: m.text, outgoing: m.outgoing, time: m.timestamp })
          await client.deleteNotification(n.receiptId)
        } catch (e) {
          if (!stop) setError(e instanceof Error ? e.message : String(e))
          await new Promise((r) => setTimeout(r, 3000))
        }
      }
    })()
    return () => {
      stop = true
    }
  }, [client])

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: 'end' })
  }, [chats, active])

  function createChat(e: FormEvent) {
    e.preventDefault()
    const id = phoneToChatId(phone)
    if (!id) {
      setError('Некорректный номер телефона')
      return
    }
    setChats((p) => (p[id] ? p : { ...p, [id]: [] }))
    setActive(id)
    setPhone('')
    setError('')
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    const msg = text.trim()
    if (!active || !msg) return
    setText('')
    try {
      const { idMessage } = await client.sendMessage(active, msg)
      addMsg(active, { id: idMessage, text: msg, outgoing: true, time: Date.now() })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setText(msg)
    }
  }

  const messages = active ? chats[active] ?? [] : []
  return (
    <div className={`layout ${active ? 'has-active' : ''}`}>
      <aside className="sidebar">
        <header>
          <span className="logo small">MAX</span>
          {demo && <span className="badge">демо</span>}
          <button className="link" onClick={onLogout}>Выйти</button>
        </header>
        <form className="new-chat" onSubmit={createChat}>
          <input placeholder="Номер, напр. 79991234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button aria-label="Создать чат">+</button>
        </form>
        <ul>
          {Object.keys(chats).map((id) => {
            const last = chats[id].at(-1)
            return (
              <li key={id} className={id === active ? 'active' : ''} onClick={() => setActive(id)}>
                <div className="avatar">{chatIdToPhone(id).slice(-2)}</div>
                <div><b>{chatIdToPhone(id)}</b><small>{last?.text ?? 'Нет сообщений'}</small></div>
              </li>
            )
          })}
        </ul>
      </aside>
      <main className="chat">
        {active ? (
          <>
            <header>
              <button className="link back" onClick={() => setActive(null)}>←</button>
              <b>{chatIdToPhone(active)}</b>
              <span />
            </header>
            <div className="messages">
              {messages.map((m) => (
                <div key={m.id} className={`bubble ${m.outgoing ? 'out' : 'in'}`}>
                  {m.text}
                  <time>{new Date(m.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <form className="composer" onSubmit={send}>
              <input placeholder="Сообщение" value={text} onChange={(e) => setText(e.target.value)} />
              <button aria-label="Отправить" disabled={!text.trim()}>➤</button>
            </form>
          </>
        ) : (
          <div className="empty">Введите номер получателя слева, чтобы начать чат</div>
        )}
        {error && <div className="toast" onClick={() => setError('')}>{error}</div>}
      </main>
    </div>
  )
}
