import type { GreenApiClient, RawNotification } from './greenApi'

const REPLIES = [
  'Привет! Получил твоё сообщение 👋',
  'Да, всё отлично видно.',
  'Это демо-ответ: в реальном режиме здесь будет ответ из MAX.',
  'Ок, договорились!',
]

/** In-memory imitation of GREEN-API for demo mode (no network). */
export function createDemoClient(opts: { replyDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {}): GreenApiClient {
  const delay = opts.replyDelayMs ?? 2000
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const queue: RawNotification[] = []
  let seq = 0
  let receipt = 0
  let replyIdx = 0

  return {
    async getStateInstance() {
      return { stateInstance: 'authorized' }
    },
    async sendMessage(chatId, message) {
      if (!chatId || !message) throw new Error('GREEN-API 400: Validation failed')
      const idMessage = `DEMO-OUT-${++seq}`
      const text = REPLIES[replyIdx++ % REPLIES.length]
      setTimeout(() => {
        queue.push({
          receiptId: ++receipt,
          body: {
            typeWebhook: 'incomingMessageReceived',
            timestamp: Math.floor(Date.now() / 1000),
            idMessage: `DEMO-IN-${receipt}`,
            senderData: { chatId },
            messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
          },
        })
      }, delay)
      return { idMessage }
    },
    async receiveNotification(receiveTimeout = 5) {
      const deadline = Date.now() + receiveTimeout * 1000
      while (queue.length === 0 && Date.now() < deadline) await sleep(200)
      return queue[0] ?? null
    },
    async deleteNotification(receiptId) {
      const i = queue.findIndex((n) => n.receiptId === receiptId)
      if (i < 0) return { result: false }
      queue.splice(i, 1)
      return { result: true }
    },
  }
}
