export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface IncomingText {
  receiptId: number
  idMessage: string
  chatId: string
  text: string
  timestamp: number
  outgoing: boolean
  /** Sender phone (MAX may send numeric chatId instead of phone@c.us) */
  senderPhone?: string
}

export interface GreenApiClient {
  getStateInstance(): Promise<{ stateInstance: string }>
  sendMessage(chatId: string, message: string): Promise<{ idMessage: string }>
  receiveNotification(receiveTimeout?: number): Promise<RawNotification | null>
  deleteNotification(receiptId: number): Promise<{ result: boolean }>
}

export const DEFAULT_API_URL = 'https://api.green-api.com'

export function methodUrl(c: Credentials, method: string): string {
  const base = (c.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
  return `${base}/waInstance${encodeURIComponent(c.idInstance)}/${method}/${encodeURIComponent(c.apiTokenInstance)}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const text = await res.text()
  if (!res.ok) throw new Error(`GREEN-API ${res.status}: ${text || res.statusText}`)
  return (text ? JSON.parse(text) : null) as T
}

export function getStateInstance(c: Credentials) {
  return request<{ stateInstance: string }>(methodUrl(c, 'getStateInstance'))
}

export function sendMessage(c: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(methodUrl(c, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
}

/** Raw notification as returned by ReceiveNotification (null if queue is empty). */
export interface RawNotification {
  receiptId: number
  body: {
    typeWebhook: string
    timestamp?: number
    idMessage?: string
    senderData?: { chatId?: string; senderPhoneNumber?: number | string }
    messageData?: {
      typeMessage?: string
      textMessageData?: { textMessage?: string }
      extendedTextMessageData?: { text?: string }
    }
  }
}

export function receiveNotification(c: Credentials, receiveTimeout = 5) {
  return request<RawNotification | null>(
    `${methodUrl(c, 'receiveNotification')}?receiveTimeout=${receiveTimeout}`,
  )
}

export function deleteNotification(c: Credentials, receiptId: number) {
  return request<{ result: boolean }>(`${methodUrl(c, 'deleteNotification')}/${receiptId}`, {
    method: 'DELETE',
  })
}

export function createRealClient(c: Credentials): GreenApiClient {
  return {
    getStateInstance: () => getStateInstance(c),
    sendMessage: (chatId, message) => sendMessage(c, chatId, message),
    receiveNotification: (t) => receiveNotification(c, t),
    deleteNotification: (id) => deleteNotification(c, id),
  }
}

const TEXT_WEBHOOKS = ['incomingMessageReceived', 'outgoingMessageReceived', 'outgoingAPIMessageReceived']

/** Extracts a text message from a notification; returns null for anything else. */
export function parseNotification(n: RawNotification): IncomingText | null {
  const b = n.body
  if (!TEXT_WEBHOOKS.includes(b.typeWebhook)) return null
  const md = b.messageData
  const text = md?.textMessageData?.textMessage ?? md?.extendedTextMessageData?.text
  const chatId = b.senderData?.chatId
  if (!text || !chatId) return null
  return {
    receiptId: n.receiptId,
    idMessage: b.idMessage ?? String(n.receiptId),
    chatId,
    text,
    timestamp: (b.timestamp ?? Date.now() / 1000) * 1000,
    outgoing: b.typeWebhook !== 'incomingMessageReceived',
    senderPhone: b.senderData?.senderPhoneNumber != null ? String(b.senderData.senderPhoneNumber) : undefined,
  }
}
