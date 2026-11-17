import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DailyTask } from '../components/DailyTask'
import { LevelBadge } from '../components/FormulaCard'
import { Icon } from '../components/Icon'
import { Tex } from '../components/Tex'
import { formulas, type Branch } from '../data/formulas'
import type { Lang } from '../i18n'
import { useStore, XP_PER_LEVEL } from '../lib/store'

function branchStats(branch: Branch, viewed: string[]) {
  const all = formulas.filter((f) => f.branch === branch)
  const done = all.filter((f) => viewed.includes(f.id)).length
  return { done, total: all.length, pct: Math.round((done / all.length) * 100) }
}

export function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { level, levelXp, streak, viewed, dueKeys } = useStore()
  const day = Math.floor(Date.now() / 86400000)
  const fod = formulas[day % formulas.length]

  return (
    <div className="page" style={{ display: 'grid', gap: 18 }}>
      <div className="space-panel" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{t('home.hello')}</h1>
          <span style={{ display: 'flex', gap: 14, color: 'var(--accent)', fontWeight: 600 }}>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="star" size={18} />{t('home.level', { n: level })}</span>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="flame" size={18} />{t('home.streak', { count: streak })}</span>
          </span>
        </div>
        <div className="bar"><div style={{ width: `${levelXp}%` }} /></div>
        <span className="muted small">{t('home.toNext', { n: XP_PER_LEVEL - levelXp })}</span>
      </div>

      {dueKeys.length > 0 && (
        <Link to="/review" className="review-banner">
          <span style={{ fontSize: 24 }}>🔁</span>
          <span style={{ flex: 1 }}><strong>{t('rev.banner', { n: dueKeys.length })}</strong><br /><span className="muted small">{t('rev.bannerHint')}</span></span>
          <span className="btn btn-primary btn-sm">{t('rev.start')}</span>
        </Link>
      )}

      <div className="grid">
        <Link to="/ent" className="tile dark"><span className="tile-icon">🎓</span><strong style={{ fontSize: 18 }}>{t('nav.ent')}</strong><span className="muted small">{t('home.entDesc')}</span></Link>
        <Link to="/review" className="tile"><span className="tile-icon">🔁</span><strong style={{ fontSize: 18 }}>{t('nav.review')}</strong><span className="muted small">{t('home.reviewDesc', { n: dueKeys.length })}</span></Link>
        <Link to="/teacher" className="tile"><span className="tile-icon">🖨</span><strong style={{ fontSize: 18 }}>{t('nav.teacher')}</strong><span className="muted small">{t('home.teacherDesc')}</span></Link>
      </div>

      <DailyTask />

      <div className="grid">
        {(['algebra', 'geometry'] as const).map((b) => {
          const s = branchStats(b, viewed)
          return (
            <Link key={b} to={`/formulas?branch=${b}`} className="tile">
              <span className="tile-icon" style={{ color: `var(--${b})` }}><Icon name={b === 'algebra' ? 'variable' : 'triangle'} /></span>
              <strong style={{ fontSize: 18 }}>{t(`branch.${b}`)}</strong>
              <div className="bar"><div style={{ width: `${s.pct}%`, background: `var(--${b})` }} /></div>
              <span className="muted small">{t('home.studied', { done: s.done, total: s.total })}</span>
            </Link>
          )
        })}
        <Link to="/formulas" className="tile">
          <span className="tile-icon"><Icon name="book" /></span>
          <strong style={{ fontSize: 18 }}>{t('nav.formulas')}</strong>
          <span className="muted small">{t('home.formulasDesc')}</span>
        </Link>
        <Link to="/calculator" className="tile dark">
          <span className="tile-icon"><Icon name="calc" /></span>
          <strong style={{ fontSize: 18 }}>{t('nav.calculator')}</strong>
          <span className="muted small">{t('home.calcDesc')}</span>
        </Link>
        <Link to="/lessons" className="tile">
          <span className="tile-icon"><Icon name="play" /></span>
          <strong style={{ fontSize: 18 }}>{t('nav.lessons')}</strong>
          <span className="muted small">{t('home.lessonsDesc')}</span>
        </Link>
        <Link to="/games" className="tile">
          <span className="tile-icon"><Icon name="puzzle" /></span>
          <strong style={{ fontSize: 18 }}>{t('nav.games')}</strong>
          <span className="muted small">{t('home.gamesDesc')}</span>
        </Link>
      </div>

      <div className="card card-dashed">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="muted small">{t('home.formulaOfDay')}</span>
          <LevelBadge level={fod.level} />
        </div>
        <h3 style={{ margin: '6px 0' }}>{fod.title[lang]}</h3>
        <div style={{ fontSize: 22, overflowX: 'auto', overflowY: 'hidden', padding: '6px 0' }}><Tex tex={fod.tex} /></div>
        <p className="muted" style={{ margin: '4px 0 12px' }}>{fod.explain[lang]}</p>
        <Link className="btn btn-sm" to={`/formulas?s=${fod.section}&t=${fod.topic}&open=${fod.id}`}>{t('home.open')}</Link>
      </div>
    </div>
  )
}
