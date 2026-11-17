import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '../lib/store'
import { Icon } from './Icon'

const items = [
  { to: '/', key: 'home', icon: 'home' },
  { to: '/formulas', key: 'formulas', icon: 'book' },
  { to: '/calculator', key: 'calculator', icon: 'calc' },
  { to: '/lessons', key: 'lessons', icon: 'play' },
  { to: '/progress', key: 'progress', icon: 'chart' },
  { to: '/games', key: 'games', icon: 'puzzle' },
] as const

export function Layout() {
  const { t, i18n } = useTranslation()
  const { xp, theme, setTheme } = useStore()
  const lang = i18n.language

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="logo">
            <span className="logo-mark">∑</span>
            <span>{t('app.name')}</span>
          </NavLink>
          <nav className="nav">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.to === '/'}>
                {t(`nav.${it.key}`)}
              </NavLink>
            ))}
          </nav>
          <div className="top-right">
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

      <nav className="bottom-nav">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.to === '/'}>
            <Icon name={it.icon} size={22} />
            {t(`nav.${it.key}`)}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
