import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { currentLocation, renderWithProviders } from '@/test/render'
import { SearchBox } from './SearchBox'
import { useSearchHistory } from './searchHistoryStore'

beforeEach(() => {
  useSearchHistory.setState({ recent: ['NPK 16-16-16', 'tractor'] })
})

describe('SearchBox', () => {
  it('shows recent searches when focused', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchBox />)
    await user.click(screen.getByRole('combobox'))
    const recent = within(screen.getByRole('listbox')).getByRole('group', { name: /Recent searches/ })
    expect(
      within(recent)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['NPK 16-16-16', 'tractor'])
  })

  it('suggests products, categories and producers while typing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchBox />)
    await user.type(screen.getByRole('combobox'), 'tractor')
    const products = await screen.findByRole('group', { name: 'Products' })
    expect(within(products).getAllByRole('option').length).toBeGreaterThan(0)
    expect(within(products).getAllByRole('option')[0]).toHaveTextContent(/tractor/i)
    expect(screen.getByRole('group', { name: 'Search everything' })).toHaveTextContent('tractor')
  })

  it('opens the highlighted suggestion with the arrow keys and Enter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchBox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'tractor')
    await screen.findByRole('group', { name: 'Products' })
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant')
    await user.keyboard('{Enter}')
    expect(currentLocation()).toMatch(/^\/product\/pr-\d+$/)
  })

  it('searches for the typed text on Enter and remembers it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchBox />)
    await user.type(screen.getByRole('combobox'), 'potatoes{Enter}')
    expect(currentLocation()).toBe('/search?q=potatoes')
    expect(useSearchHistory.getState().recent[0]).toBe('potatoes')
  })

  it('closes the suggestions with Escape, then clears the text', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchBox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'tr')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('tr')
    await user.keyboard('{Escape}')
    expect(input).toHaveValue('')
  })

  it('focuses with the "/" shortcut', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchBox shortcut />)
    await user.keyboard('/')
    expect(screen.getByRole('combobox')).toHaveFocus()
  })
})
