import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from './Tabs'

type Tab = 'overview' | 'documents' | 'reviews'

function Example() {
  const [active, setActive] = useState<Tab>('overview')
  return (
    <Tabs
      label="Producer"
      active={active}
      onChange={setActive}
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'documents', label: 'Documents' },
        { id: 'reviews', label: 'Reviews' },
      ]}
    >
      Panel: {active}
    </Tabs>
  )
}

describe('Tabs', () => {
  it('selects a tab on click and labels the panel with it', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('tab', { name: 'Documents' }))
    expect(screen.getByRole('tab', { name: 'Documents' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Documents' })).toHaveTextContent('Panel: documents')
  })

  it('moves with the arrow keys, Home and End, wrapping around', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps only the selected tab in the Tab order', () => {
    render(<Example />)
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1, -1])
  })
})
