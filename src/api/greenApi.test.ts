import { describe, expect, it, vi, afterEach } from 'vitest'
import { deleteNotification, methodUrl, parseNotification, receiveNotification, sendMessage } from './greenApi'

const c = { apiUrl: 'https://api.green-api.com/', idInstance: '1101', apiTokenInstance: 'tok' }
afterEach(() => vi.restoreAllMocks())

describe('greenApi', () => {
  it('builds method URL', () => {
    expect(methodUrl(c, 'sendMessage')).toBe('https://api.green-api.com/waInstance1101/sendMessage/tok')
  })
  it('sends message via POST', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"idMessage":"X1"}'))
    expect(await sendMessage(c, '79991234567@c.us', 'hi')).toEqual({ idMessage: 'X1' })
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://api.green-api.com/waInstance1101/sendMessage/tok')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init!.body as string)).toEqual({ chatId: '79991234567@c.us', message: 'hi' })
  })
  it('receives empty queue as null and deletes by receiptId', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('null'))
      .mockResolvedValueOnce(new Response('{"result":true}'))
    expect(await receiveNotification(c, 5)).toBeNull()
    expect(f.mock.calls[0][0]).toBe('https://api.green-api.com/waInstance1101/receiveNotification/tok?receiveTimeout=5')
    await deleteNotification(c, 42)
    expect(f.mock.calls[1][0]).toBe('https://api.green-api.com/waInstance1101/deleteNotification/tok/42')
    expect(f.mock.calls[1][1]?.method).toBe('DELETE')
  })
  it('throws on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Unauthorized', { status: 401 }))
    await expect(sendMessage(c, 'x', 'y')).rejects.toThrow('401')
  })
  it('parses incoming text and extended text', () => {
    const base = { typeWebhook: 'incomingMessageReceived', idMessage: 'A', timestamp: 100, senderData: { chatId: '7999@c.us' } }
    expect(parseNotification({ receiptId: 1, body: { ...base, messageData: { textMessageData: { textMessage: 'привет' } } } }))
      .toMatchObject({ chatId: '7999@c.us', text: 'привет', outgoing: false, timestamp: 100000 })
    expect(parseNotification({ receiptId: 2, body: { ...base, messageData: { extendedTextMessageData: { text: 'link' } } } })?.text).toBe('link')
  })
  it('ignores non-text notifications', () => {
    expect(parseNotification({ receiptId: 3, body: { typeWebhook: 'stateInstanceChanged' } })).toBeNull()
    expect(parseNotification({ receiptId: 4, body: { typeWebhook: 'incomingMessageReceived', senderData: { chatId: 'a' }, messageData: { typeMessage: 'imageMessage' } } })).toBeNull()
  })
  it('exposes senderPhoneNumber for MAX numeric chatId', () => {
    const m = parseNotification({ receiptId: 9, body: { typeWebhook: 'incomingMessageReceived', senderData: { chatId: '10000000', senderPhoneNumber: 79876543210 }, messageData: { textMessageData: { textMessage: 'x' } } } })
    expect(m).toMatchObject({ chatId: '10000000', senderPhone: '79876543210' })
  })
})
