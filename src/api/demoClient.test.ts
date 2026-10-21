import { describe, expect, it, vi, afterEach } from 'vitest'
import { createDemoClient } from './demoClient'
import { parseNotification } from './greenApi'

afterEach(() => vi.useRealTimers())

describe('demo client', () => {
  it('is authorized', async () => {
    expect(await createDemoClient().getStateInstance()).toEqual({ stateInstance: 'authorized' })
  })
  it('returns empty queue as null after timeout', async () => {
    expect(await createDemoClient({ sleep: async () => {} }).receiveNotification(0)).toBeNull()
  })
  it('delivers a reply after sending, then deletes it', async () => {
    vi.useFakeTimers()
    const c = createDemoClient({ replyDelayMs: 2000 })
    const { idMessage } = await c.sendMessage('79991234567@c.us', 'hi')
    expect(idMessage).toMatch(/^DEMO-OUT-/)
    vi.advanceTimersByTime(2000)
    const n = await c.receiveNotification(5)
    expect(n).not.toBeNull()
    const m = parseNotification(n!)
    expect(m).toMatchObject({ chatId: '79991234567@c.us', outgoing: false })
    expect(m!.text.length).toBeGreaterThan(0)
    expect(await c.deleteNotification(n!.receiptId)).toEqual({ result: true })
    expect(await c.deleteNotification(n!.receiptId)).toEqual({ result: false })
  })
  it('validates input', async () => {
    await expect(createDemoClient().sendMessage('', 'x')).rejects.toThrow('400')
  })
})
