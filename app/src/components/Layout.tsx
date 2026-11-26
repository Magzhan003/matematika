import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isTeacherPath, studentOnly, useRole } from '../lib/role'
import { useStore } from '../lib/store'
import { Login } from '../pages/Login'
import { CloudLogin } from '../pages/CloudLogin'
import { cloud } from '../lib/cloud'
import { CloudSync } from './CloudSync'
import { Icon } from './Icon'
import { MathKeyboard } from './MathKeyboard'
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
  { to: '/classes', key: 'classes', emoji: '👥', online: true },
  { to: '/tasks', key: 'tasks', emoji: '📬', online: true },
  { to: '/classroom', key: 'classroom', emoji: '🧰' },
  { to: '/solids', key: 'solids', emoji: '📦' },
  { to: '/olympiad', key: 'olympiad', emoji: '🏆' },
  { to: '/worksheets', key: 'worksheets', emoji: '📑' },
  { to: '/summative', key: 'summative', emoji: '🎯' },
  { to: '/scenario', key: 'scenario', emoji: '🗓' },
  { to: '/textbook', key: 'textbook', emoji: '📘' },
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
  { to: '/portfolio', key: 'portfolio', emoji: '🗂' },
] as { to: string; key: string; emoji: string; online?: boolean }[]

/** Menu icons from one outline set (emoji look different on every computer). */
const MENU_ICON: Record<string, string> = {
  classes: 'users', tasks: 'inbox', classroom: 'tool', solids: 'cube', olympiad: 'trophy', worksheets: 'file', summative: 'clipboard',
  scenario: 'calendar', textbook: 'book', program: 'layers', map: 'map', diagnostic: 'compass', review: 'repeat', games: 'puzzle',
  progress: 'chart', geometry: 'ruler', word: 'bulb', work: 'edit', cheat: 'file', teacher: 'printer', journal: 'clipboard', portfolio: 'folder',
}

export function Layout() {
  const { t, i18n } = useTranslation()
  const { xp, theme, setTheme, dueKeys } = useStore()
  const lang = i18n.language
  const [more, setMore] = useState(false)
  const [board, setBoard] = useState(false)
  const [pres, setPres] = useState(false)
  const [kbd, setKbd] = useState(false)
  // the whiteboard (and anything else) can ask for the keyboard
  useEffect(() => {
    const open = () => setKbd(true)
    window.addEventListener('mathkbd:open', open)
    return () => window.removeEventListener('mathkbd:open', open)
  }, [])
  const loc = useLocation()
  useEffect(() => setMore(false), [loc.pathname])
  const extraActive = extra.some((e) => loc.pathname.startsWith(e.to))
  const { role, logout } = useRole()
  // a student does not see the teacher's tools
  const items = extra.filter((e) => (role === 'teacher' ? !studentOnly.includes(e.to) : !isTeacherPath(e.to)) && (!e.online || !!cloud))

  const moreMenu = more && (
    <div className="more-menu" role="menu">
      {items.map((e) => (
        <NavLink key={e.to} to={e.to} role="menuitem">
          <span className="menu-ic" aria-hidden="true"><Icon name={MENU_ICON[e.key] ?? 'layers'} size={17} /></span> {t(`nav.${e.key}`)}
          {e.key === 'review' && dueKeys.length > 0 && <span className="dot-badge">{dueKeys.length}</span>}
        </NavLink>
      ))}
    </div>
  )

  if (!role) return cloud ? <CloudLogin /> : <Login />

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
            {role === 'teacher' && <button className="tool-btn" onClick={() => setPres(true)} title={t('pres.title')} aria-label={t('pres.title')}>📺<span className="tool-label">{t('pres.open')}</span></button>}
            <button className={`tool-btn ${kbd ? 'on' : ''}`} onClick={() => setKbd(!kbd)} title={t('kbd.title')} aria-label={t('kbd.title')} aria-pressed={kbd}>⌨<span className="tool-label">{t('kbd.open')}</span></button>
            {role === 'student' && <span className="xp-chip" title="XP"><Icon name="star" size={16} />{xp}<span className="xp-label">XP</span></span>}
            <button className="icon-btn role-btn" title={`${role === 'teacher' ? t('login.teacher') : t('login.student')} — ${t('login.logout')}`} aria-label={t('login.logout')}
              onClick={() => { if (window.confirm(t('login.logoutAsk'))) logout() }}>
              {role === 'teacher' ? '👩‍🏫' : '🎓'}
            </button>
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
        {role === 'student' && isTeacherPath(loc.pathname) ? <Navigate to="/" replace /> : <Outlet />}
      </main>

      {board && <Whiteboard onClose={() => setBoard(false)} />}
      {pres && <Presenter onClose={() => setPres(false)} />}
      {kbd && <MathKeyboard onClose={() => setKbd(false)} />}
      {cloud && <CloudSync />}

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
