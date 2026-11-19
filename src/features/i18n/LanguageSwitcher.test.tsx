import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePreferences } from '@/features/settings/preferencesStore'
import { LanguageSwitcher } from './LanguageSwitcher'

beforeEach(() => {
  usePreferences.setState({ language: 'en' })
})

describe('LanguageSwitcher', () => {
  it('offers every language by its code and saves the choice', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox', { name: 'Language' })
    expect([...(select as HTMLSelectElement).options].map((o) => o.text)).toEqual(['EN', 'DE', 'RO'])
    await user.selectOptions(select, 'ro')
    expect(usePreferences.getState().language).toBe('ro')
  })

  it('shows native language names in the full version', () => {
    render(<LanguageSwitcher compact={false} showLabel />)
    expect(screen.getByRole('option', { name: 'Deutsch' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Română' })).toBeInTheDocument()
  })
})
