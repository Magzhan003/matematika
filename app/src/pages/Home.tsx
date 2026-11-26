import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DailyTask } from '../components/DailyTask'
import { MyPlan } from '../components/MyPlan'
import { LevelBadge } from '../components/FormulaCard'
import { Icon } from '../components/Icon'
import { Tex } from '../components/Tex'
import { formulas, type Branch } from '../data/formulas'
import type { Lang } from '../i18n'
import { cloud, useCloud } from '../lib/cloud'
import { useRole } from '../lib/role'
import { useStore, XP_PER_LEVEL } from '../lib/store'

function branchStats(branch: Branch, viewed: string[]) {
  const all = formulas.filter((f) => f.branch === branch)
  const done = all.filter((f) => viewed.includes(f.id)).length
  return { done, total: all.length, pct: Math.round((done / all.length) * 100) }
}

/** Gold ring: progress inside the current level. */
function LevelRing({ level, pct }: { level: number; pct: number }) {
  const r = 46, c = 2 * Math.PI * r
  return (
    <svg className="ring" viewBox="0 0 112 112" role="img" aria-label={`${level}`}>
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0cf7a" /><stop offset="1" stopColor="#b8862b" /></linearGradient>
      </defs>
      <circle cx="56" cy="56" r={r} className="ring-track" />
      <circle cx="56" cy="56" r={r} className="ring-value" stroke="url(#ring-gold)" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} />
    </svg>
  )
}

/** Decorative «constellation» of formulas behind the greeting. */
function Sky() {
  const stars: [number, number][] = [[60, 40], [150, 90], [250, 30], [330, 120], [430, 60], [520, 140], [610, 50], [700, 110]]
  return (
    <svg className="hero-sky" viewBox="0 0 760 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <polyline points={stars.map((s) => s.join(',')).join(' ')} />
      {stars.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 2 : 3.2} />)}
      <text x="96" y="182">a² + b² = c²</text>
      <text x="380" y="200">∫ f(x) dx</text>
      <text x="300" y="44">sin²α + cos²α = 1</text>
    </svg>
  )
}

type Tile = { to: string; icon: string; key: string; desc: string; tone: string; teacher?: boolean; student?: boolean; online?: boolean }

export function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { level, levelXp, streak, viewed, dueKeys, solved, xp, name } = useStore()
  const { role } = useRole()
  const { profile } = useCloud()
  const teacher = role === 'teacher'
  const day = Math.floor(Date.now() / 86400000)
  const fod = formulas[day % formulas.length]
  const hour = new Date().getHours()
  const greet = t(`home.greet.${hour < 12 ? 'morning' : hour < 18 ? 'day' : 'evening'}`)
  const who = (profile?.full_name || name || '').split(' ')[0]
  const date = new Date().toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const alg = branchStats('algebra', viewed), geo = branchStats('geometry', viewed)

  const tiles: Tile[] = [
    { to: '/lessons', icon: 'play', key: 'lessons', desc: 'home.lessonsDesc', tone: 'violet' },
    { to: '/calculator', icon: 'calc', key: 'calculator', desc: 'home.calcDesc', tone: 'teal' },
    { to: '/ent', icon: 'graduation', key: 'ent', desc: 'home.entDesc', tone: 'gold' },
    { to: '/olympiad', icon: 'trophy', key: 'olympiad', desc: 'home.olympDesc', tone: 'rose' },
    { to: '/games', icon: 'puzzle', key: 'games', desc: 'home.gamesDesc', tone: 'sky' },
    { to: '/summative', icon: 'clipboard', key: 'summative', desc: 'home.sorDesc', tone: 'violet', teacher: true },
    { to: '/worksheets', icon: 'printer', key: 'worksheets', desc: 'home.sheetsDesc', tone: 'teal', teacher: true },
    { to: '/review', icon: 'repeat', key: 'review', desc: 'home.reviewTile', tone: 'sky' },
    { to: '/map', icon: 'map', key: 'map', desc: 'home.mapDesc', tone: 'teal', student: true },
    { to: '/solids', icon: 'cube', key: 'solids', desc: 'home.solidsDesc', tone: 'gold', student: true },
  ]
  const actions = teacher
    ? [
        { to: '/teacher', icon: 'edit', label: t('home.act.createWork'), primary: true },
        ...(cloud ? [{ to: '/classes', icon: 'users', label: t('nav.classes'), primary: false }] : []),
        { to: '/journal', icon: 'clipboard', label: t('nav.journal'), primary: false },
        { to: '/scenario', icon: 'calendar', label: t('nav.scenario'), primary: false },
      ]
    : [
        { to: '/lessons', icon: 'play', label: t('home.act.continue'), primary: true },
        ...(cloud ? [{ to: '/tasks', icon: 'inbox', label: t('nav.tasks'), primary: false }] : []),
        { to: '/ent', icon: 'graduation', label: t('home.act.ent'), primary: false },
      ]

  return (
    <div className="page home">
      <section className="hero">
        <Sky />
        <div className="hero-main">
          <span className="eyebrow">{date}</span>
          <h1>{greet}{who ? `, ${who}` : ''}</h1>
          <p className="hero-sub">{teacher ? t('home.teacherSub') : t('home.studentSub')}</p>
          <div className="hero-actions">
            {actions.map((a) => (
              <Link key={a.to} to={a.to} className={a.primary ? 'hero-btn primary' : 'hero-btn'}><Icon name={a.icon} size={18} />{a.label}</Link>
            ))}
          </div>
        </div>
        {!teacher && (
          <div className="hero-stats">
            <div className="ring-box">
              <LevelRing level={level} pct={levelXp} />
              <div className="ring-label"><b>{level}</b><span>{t('home.levelWord')}</span></div>
            </div>
            <div className="hero-mini">
              <span><Icon name="flame" size={16} /> <b>{streak}</b> {t('home.stat.streak')}</span>
              <span><Icon name="check" size={16} /> <b>{solved}</b> {t('home.stat.solved')}</span>
              <span><Icon name="star" size={16} /> <b>{xp}</b> XP · {t('home.toNextShort', { n: XP_PER_LEVEL - levelXp })}</span>
            </div>
          </div>
        )}
      </section>

      {dueKeys.length > 0 && (
        <Link to="/review" className="review-banner">
          <span className="rb-icon"><Icon name="repeat" size={22} /></span>
          <span style={{ flex: 1 }}><strong>{t('rev.banner', { n: dueKeys.length })}</strong><br /><span className="muted small">{t('rev.bannerHint')}</span></span>
          <span className="btn btn-primary btn-sm">{t('rev.start')}</span>
        </Link>
      )}

      {!teacher && <MyPlan />}

      <div className="sec-head"><h2>{t('home.sections')}</h2><Link to="/formulas" className="sec-link">{t('home.allFormulas')} <Icon name="arrow" size={16} /></Link></div>
      <div className="bento">
        <Link to="/formulas" className="bento-tile big">
          <span className="b-icon gold"><Icon name="book" size={26} /></span>
          <strong>{t('nav.formulas')}</strong>
          <span className="b-desc">{t('home.formulasDesc')}</span>
          <div className="b-progress">
            <div><span>{t('branch.algebra')}</span><span>{alg.done}/{alg.total}</span></div>
            <div className="bar"><div style={{ width: `${alg.pct}%` }} /></div>
            <div><span>{t('branch.geometry')}</span><span>{geo.done}/{geo.total}</span></div>
            <div className="bar"><div style={{ width: `${geo.pct}%` }} /></div>
          </div>
          <span className="b-go"><Icon name="arrow" size={18} /></span>
        </Link>
        {tiles.filter((x) => (!x.teacher || teacher) && (!x.student || !teacher) && (!x.online || cloud)).map((x) => (
          <Link key={x.to} to={x.to} className={`bento-tile tone-${x.tone}`}>
            <span className="b-icon"><Icon name={x.icon} size={22} /></span>
            <strong>{t(`nav.${x.key}`)}</strong>
            <span className="b-desc">{t(x.desc, { n: dueKeys.length })}</span>
            <span className="b-go"><Icon name="arrow" size={18} /></span>
          </Link>
        ))}
      </div>

      <div className="home-split">
        <article className="fod">
          <div className="fod-top"><span className="eyebrow">{t('home.formulaOfDay')}</span><LevelBadge level={fod.level} /></div>
          <h3>{fod.title[lang]}</h3>
          <div className="fod-tex"><Tex tex={fod.tex} /></div>
          <p className="muted">{fod.explain[lang]}</p>
          <Link className="sec-link" to={`/formulas?s=${fod.section}&t=${fod.topic}&open=${fod.id}`}>{t('home.open')} <Icon name="arrow" size={16} /></Link>
        </article>
        <div id="daily" className="daily-wrap"><DailyTask /></div>
      </div>
    </div>
  )
}
