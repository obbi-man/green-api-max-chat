// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('shows login form when not logged in', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('idInstance')).toBeTruthy()
    expect(screen.getByPlaceholderText('apiTokenInstance')).toBeTruthy()
  })
  it('opens chat UI from the demo button', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Демо-режим (без аккаунта)'))
    expect(screen.getByText('демо')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Номер, напр. 79991234567'), { target: { value: '79991234567' } })
    fireEvent.click(screen.getByLabelText('Создать чат'))
    fireEvent.change(screen.getByPlaceholderText('Номер, напр. 79991234567'), { target: { value: '79161234567' } })
    fireEvent.click(screen.getByLabelText('Создать чат'))
    expect(screen.getAllByText('+79161234567').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+79991234567').length).toBeGreaterThan(0)
  })
})
