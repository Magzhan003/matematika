import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '../lib/store'
import { Icon } from './Icon'
import { Presenter } from './Presenter'
import { Whiteboard } from './Whiteboard'

const main = [
  { to: '/', key: 'home', icon: 'home' },
  { to: '/formulas', key: 'formulas', icon: 'book' },
  { to: '/calculator', key: 'calculator', icon: 'calc' },
  { to: '/lessons', key: 'lessons', icon: 'play' },
  { to: '/ent', key: 'ent', icon: 'star' },
] as const

const extra = [
  { to: '/program', key: 'program', emoji: '📅' },
  { to: '/map', key: 'map', emoji: '🗺' },
  { to: '/diagnostic', key: 'diagnostic', emoji: '🧭' },
  { to: '/review', key: 'review', emoji: '🔁' },
  { to: '/games', key: 'games', emoji: '🎮' },
  { to: '/progress', key: 'progress', emoji: '📊' },
  { to: '/geometry', key: 'geometry', emoji: '📐' },
  { to: '/word', key: 'word', emoji: '🧩' },
  { to: '/work', key: 'work', emoji: '📝' },
  { to: '/cheatsheet', key: 'cheat', emoji: '📄' },
  { to: '/teacher', key: 'teacher', emoji: '🖨' },
  { to: '/journal', key: 'journal', emoji: '📋' },
] as const

export function Layout() {
  const { t, i18n } = useTranslation()
  const { xp, theme, setTheme, dueKeys } = useStore()
  const lang = i18n.language
  const [more, setMore] = useState(false)
  const [board, setBoard] = useState(false)
  const [pres, setPres] = useState(false)
  const loc = useLocation()
  useEffect(() => setMore(false), [loc.pathname])
  const extraActive = extra.some((e) => loc.pathname.startsWith(e.to))

  const moreMenu = more && (
    <div className="more-menu" role="menu">
      {extra.map((e) => (
        <NavLink key={e.to} to={e.to} role="menuitem">
          <span aria-hidden="true">{e.emoji}</span> {t(`nav.${e.key}`)}
          {e.key === 'review' && dueKeys.length > 0 && <span className="dot-badge">{dueKeys.length}</span>}
        </NavLink>
      ))}
    </div>
  )

  return (
    <>
      <header className="topbar no-print">
        <div className="topbar-inner">
          <NavLink to="/" className="logo">
            <span className="logo-mark">∑</span>
            <span>{t('app.name')}</span>
          </NavLink>
          <nav className="nav">
            {main.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.to === '/'}>{t(`nav.${it.key}`)}</NavLink>
            ))}
            <span style={{ position: 'relative' }}>
              <button className={`nav-more ${extraActive ? 'active' : ''}`} onClick={() => setMore(!more)} aria-expanded={more}>
                {t('nav.more')} ▾{dueKeys.length > 0 && <span className="dot-badge">{dueKeys.length}</span>}
              </button>
              {moreMenu}
            </span>
          </nav>
          <div className="top-right">
            <button className="tool-btn" onClick={() => setBoard(true)} title={t('wb.title')} aria-label={t('wb.title')}>✏️<span className="tool-label">{t('wb.open')}</span></button>
            <button className="tool-btn" onClick={() => setPres(true)} title={t('pres.title')} aria-label={t('pres.title')}>📺<span className="tool-label">{t('pres.open')}</span></button>
            <span className="xp-chip" title="XP"><Icon name="star" size={16} />{xp}<span className="xp-label">XP</span></span>
            <div className="seg" role="group" aria-label="Language">
              <button className={lang === 'ru' ? 'on' : ''} onClick={() => i18n.changeLanguage('ru')}>РУ</button>
              <button className={lang === 'kz' ? 'on' : ''} onClick={() => i18n.changeLanguage('kz')}>ҚАЗ</button>
            </div>
            <button
              className="icon-btn"
              aria-label={t('theme.toggle')}
              title={theme === 'paper' ? t('theme.cosmos') : t('theme.paper')}
              onClick={() => setTheme(theme === 'paper' ? 'cosmos' : 'paper')}
            >
              <Icon name={theme === 'paper' ? 'moon' : 'sun'} />
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        <Outlet />
      </main>

      {board && <Whiteboard onClose={() => setBoard(false)} />}
      {pres && <Presenter onClose={() => setPres(false)} />}

      <nav className="bottom-nav no-print">
        {main.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.to === '/'}>
            <Icon name={it.icon} size={22} />
            {t(`nav.${it.key}`)}
          </NavLink>
        ))}
        <button className={`bottom-more ${extraActive ? 'active' : ''}`} onClick={() => setMore(!more)} aria-expanded={more}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⋯</span>
          {t('nav.more')}
          {dueKeys.length > 0 && <span className="dot-badge">{dueKeys.length}</span>}
        </button>
        {moreMenu && <div className="more-sheet">{moreMenu}</div>}
      </nav>
    </>
  )
}
