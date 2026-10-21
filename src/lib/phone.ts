/** Normalizes a phone like "+7 (999) 123-45-67" or "8999..." to a chatId "79991234567@c.us". */
export function phoneToChatId(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.length < 10 || digits.length > 15) return null
  return `${digits}@c.us`
}

export function chatIdToPhone(chatId: string): string {
  return '+' + chatId.replace(/@.*$/, '')
}
