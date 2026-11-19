import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Formula } from '../data/formulas'
import type { Lang } from '../i18n'
import { useStore } from '../lib/store'
import { Icon } from './Icon'
import { Tex } from './Tex'

export function LevelBadge({ level }: { level: Formula['level'] }) {
  const { t } = useTranslation()
  return <span className={`badge lv-${level}`}>{t(`level.${level}`)}</span>
}

export function FormulaCard({ f, open, onToggle }: { f: Formula; open: boolean; onToggle: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { markViewed, viewed } = useStore()
  const seen = viewed.includes(f.id)

  const toggle = () => {
    if (!open) markViewed(f.id)
    onToggle()
  }

  return (
    <article className={`f-card ${f.branch === 'algebra' ? 'alg' : 'geo'}`} id={f.id}>
      <button className="f-head" onClick={toggle} aria-expanded={open}>
        <span className="f-title">{f.title[lang]}{seen && <span className="muted small"> ✓</span>}</span>
        <span className="f-meta">
          <span className="badge badge-line">{t('grade.n', { n: f.grade })}</span>
          <LevelBadge level={f.level} />
          <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'flex' }}>
            <Icon name="chevron" size={18} />
          </span>
        </span>
        <Tex className="f-tex" tex={f.tex} />
      </button>

      {open && (
        <div className="f-body">
          <h4>{t('formulas.explain')}</h4>
          <p style={{ margin: 0 }}>{f.explain[lang]}</p>

          <h4>{t('formulas.example')}</h4>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{f.example.task[lang]}</p>
          <div className="steps">
            {f.example.steps.map((s, i) => (
              <div className="step" key={i}><Tex className="step-tex" tex={s} /></div>
            ))}
          </div>
          <div className="answer">{t('steps.answer')}: <Tex className="step-tex" tex={f.example.answer} /></div>

          {f.example2 && (
            <div className="example2">
              <h4>{t('formulas.example2')}</h4>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{f.example2.task[lang]}</p>
              <div className="steps">
                {f.example2.steps.map((s, i) => (
                  <div className="step" key={i}><Tex className="step-tex" tex={s} /></div>
                ))}
              </div>
              <div className="answer">{t('steps.answer')}: <Tex className="step-tex" tex={f.example2.answer} /></div>
            </div>
          )}

          {f.calc && (
            <div style={{ marginTop: 14 }}>
              <Link className="btn btn-primary btn-sm" to={`/calculator?f=${f.id}`}>
                <Icon name="calc" size={16} /> {t('formulas.calc')}
              </Link>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
