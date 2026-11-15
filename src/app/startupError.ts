const TEXT = {
  en: {
    title: 'Stocknet could not start',
    body: 'Something saved in this browser is stopping the app from loading. Resetting the saved data usually fixes it.',
    reset: 'Reset saved data and reload',
    retry: 'Try again',
  },
  de: {
    title: 'Stocknet konnte nicht starten',
    body: 'In diesem Browser gespeicherte Daten verhindern das Laden der App. Das Zurücksetzen der gespeicherten Daten behebt das meistens.',
    reset: 'Gespeicherte Daten zurücksetzen und neu laden',
    retry: 'Erneut versuchen',
  },
  ro: {
    title: 'Stocknet nu a putut porni',
    body: 'Ceva salvat în acest browser împiedică încărcarea aplicației. De obicei, resetarea datelor salvate rezolvă problema.',
    reset: 'Resetează datele salvate și reîncarcă',
    retry: 'Încearcă din nou',
  },
}

function clearSavedData() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('sy-')) localStorage.removeItem(key)
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

/**
 * Plain-DOM fallback for failures before React renders (a module that throws while loading, a missing chunk).
 * It cannot rely on React, the router or i18n, so it carries its own three-language text.
 */
export function showStartupError() {
  const root = document.getElementById('root') ?? document.body
  const lang = navigator.language.slice(0, 2)
  const text = TEXT[lang === 'de' || lang === 'ro' ? lang : 'en']
  const button = (label: string, primary: boolean, onClick: () => void) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.textContent = label
    el.className = primary
      ? 'h-9 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-medium text-on-primary'
      : 'h-9 rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-sm font-medium'
    el.addEventListener('click', onClick)
    return el
  }
  const title = document.createElement('h1')
  title.className = 'font-display text-lg font-semibold'
  title.textContent = text.title
  const body = document.createElement('p')
  body.className = 'max-w-md text-sm text-ink-muted'
  body.textContent = text.body
  const actions = document.createElement('div')
  actions.className = 'flex flex-wrap justify-center gap-2 pt-1'
  actions.append(
    button(text.reset, true, () => {
      clearSavedData()
      window.location.reload()
    }),
    button(text.retry, false, () => window.location.reload()),
  )
  const panel = document.createElement('div')
  panel.setAttribute('role', 'alert')
  panel.dataset.startupError = ''
  panel.className = 'mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-3 px-6 text-center'
  panel.append(title, body, actions)
  root.replaceChildren(panel)
}
