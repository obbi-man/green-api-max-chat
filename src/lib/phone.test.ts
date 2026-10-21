import { describe, expect, it } from 'vitest'
import { chatIdToPhone, phoneToChatId } from './phone'

describe('phone', () => {
  it('normalizes formats', () => {
    expect(phoneToChatId('+7 (999) 123-45-67')).toBe('79991234567@c.us')
    expect(phoneToChatId('89991234567')).toBe('79991234567@c.us')
  })
  it('rejects garbage', () => expect(phoneToChatId('123')).toBeNull())
  it('formats back', () => expect(chatIdToPhone('79991234567@c.us')).toBe('+79991234567'))
})
