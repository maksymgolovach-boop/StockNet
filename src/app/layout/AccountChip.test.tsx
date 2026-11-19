import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { AccountChip } from './AccountChip'

describe('AccountChip', () => {
  it('shows the company initials and name, and links to the dashboard', () => {
    renderWithProviders(<AccountChip />)
    const link = screen.getByRole('link', { name: 'Signed in as Câmpia Moldovei Agro' })
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveTextContent('CM')
    expect(link).toHaveTextContent('Câmpia Moldovei Agro')
  })

  it('keeps only the avatar when the header is short of room, with the name in its tooltip', () => {
    renderWithProviders(<AccountChip showName={false} />)
    const link = screen.getByRole('link', { name: 'Signed in as Câmpia Moldovei Agro' })
    expect(link).toHaveTextContent(/^CM$/)
    expect(link).toHaveAttribute('title', 'Signed in as Câmpia Moldovei Agro')
  })
})
