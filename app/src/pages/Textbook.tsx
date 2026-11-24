import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ProblemVisual } from '../components/ProblemVisual'
import { Tex } from '../components/Tex'
import { algebra7, type Paragraph } from '../data/textbook'
import type { Lang } from '../i18n'
import { genById, seeded, type Problem } from '../lib/bank'

/** Practice tasks for a paragraph: its task types in turn, easy first, no repeats. */
function tasksFor(p: Paragraph, count: number, seed: number): Problem[] {
  const r = seeded(seed * 100 + p.n)
  const gs = p.gens.map(genById).filter((g): g is NonNullable<typeof g> => !!g)
  const seen = new Set<string>()
  const out: Problem[] = []
  for (let i = 0; out.length < count && i < count * 10; i++) {
    const x = gs[i % gs.length].make(r)
    if (seen.has(x.text.ru + x.tex)) continue
    seen.add(x.text.ru + x.tex); out.push(x)
  }
  return out
}

/** Textbook «Алгебра 7» by paragraphs: textbook exercises by level, homework and generated practice tasks. */
export function Textbook() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const [params, setParams] = useSearchParams()
  const open = Number(params.get('p')) || 0
  const [q, setQ] = useState('')
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 9999))
  const [count, setCount] = useState(6)
  const [show, setShow] = useState(false)
  const book = algebra7
  const par = book.paragraphs.find((x) => x.n === open)
  const tasks = useMemo(() => (par ? tasksFor(par, count, seed) : []), [par, count, seed])
  const match = (p: Paragraph) => !q.trim() || String(p.n) === q.replace(/§\s*/, '').trim() || `${p.ru} ${p.kz}`.toLowerCase().includes(q.trim().toLowerCase())
  const title = (p: Paragraph) => (lang === 'kz' ? p.kz : p.ru)
  const page = (p: Paragraph) => (lang === 'kz' ? p.page.kz : String(p.page.ru))

  return (
    <div className="page tb-page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1 style={{ margin: 0 }}>📘 {t('tb.title')}</h1>
        <div className="card tb-book">
          <div className="tb-cover">7</div>
          <div>
            <b>{book.subject[lang]} · {t('grade.n', { n: book.grade })}</b>
            <div className="muted small">{book.authors}. {book.publisher}</div>
            <div className="small">{t('tb.about')}</div>
          </div>
        </div>
        <input className="input" placeholder={t('tb.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        {book.sections.map((s, si) => {
          const list = book.paragraphs.filter((p) => p.sec === si && match(p))
          if (!list.length) return null
          return (
            <section key={si} className="tb-sec">
              <h2>{['I', 'II', 'III', 'IV', 'V', 'VI'][si]}. {s[lang]} <span className="muted small">· {t('prog.quarter', { n: s.quarter })}</span></h2>
              <div className="tb-list">
                {list.map((p) => (
                  <div key={p.n} className={`tb-par ${open === p.n ? 'open' : ''}`}>
                    <button className="tb-row" onClick={() => { setParams(open === p.n ? {} : { p: String(p.n) }, { replace: true }); setShow(false) }} aria-expanded={open === p.n}>
                      <span className="tb-n">§ {p.n}</span><span className="tb-t">{title(p)}</span><span className="muted small">{t('tb.page', { p: page(p) })}</span>
                    </button>
                    {open === p.n && (
                      <div className="tb-body">
                        <div className="tb-grid">
                          <div className="tb-box">
                            <div className="muted small">{t('tb.exercises')}</div>
                            <div className="tb-levels">
                              <span className="lvl a">A</span> {p.ex.A}
                              <span className="lvl b">B</span> {p.ex.B}
                              <span className="lvl c">C</span> {p.ex.C[lang]}
                            </div>
                          </div>
                          <div className="tb-box">
                            <div className="muted small">{t('tb.homework')}</div>
                            <div>{p.hw[lang]}</div>
                          </div>
                        </div>
                        <div className="tb-tasks-head">
                          <b>{t('tb.tasks')}</b>
                          <span className="chips">
                            {[4, 6, 8, 10].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n}</button>)}
                            <button className="chip" onClick={() => setSeed(seed + 1)}>🎲 {t('teach.newNumbers')}</button>
                            <button className={`chip ${show ? 'on' : ''}`} onClick={() => setShow(!show)}>{show ? t('scn.hideAnswers') : t('scn.showAnswers')}</button>
                            <button className="chip" onClick={() => window.print()}>🖨 {t('tb.printCard')}</button>
                          </span>
                        </div>
                        <ol className="tb-tasks">
                          {tasks.map((x, i) => (
                            <li key={i}>
                              <span className="pr-body">{x.text[lang]} {x.tex && <Tex tex={x.tex} />}<ProblemVisual p={x} /></span>
                              {show && <div className="scn-ans">→ <Tex tex={x.answer} /></div>}
                            </li>
                          ))}
                        </ol>
                        <div className="chips">
                          {[...new Set(p.gens.map((g) => genById(g)?.topic).filter(Boolean))].map((tp) => (
                            <Link key={tp} className="chip" to={`/practice/${tp}`}>✏️ {t('tb.practice')}</Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
        <p className="muted small">⚠ {t('tb.note')}</p>
      </div>

      {par && (
        <section className="sheet tb-sheet">
          <div className="sheet-head"><b>§ {par.n}. {title(par)}</b><span className="small">{book.subject[lang]} {book.grade} · {t('tb.page', { p: page(par) })} · {t('teach.code')}: {seed}</span></div>
          <div className="sheet-fields">{t('teach.name')} ______________________ {t('teach.class')} ______ {t('teach.date')} ________</div>
          <ol className="sheet-list">{tasks.map((x, i) => <li key={i} className="with-space"><span className="pr-body">{x.text[lang]} {x.tex && <Tex tex={x.tex} />}<ProblemVisual p={x} /></span></li>)}</ol>
          <div className="tb-key"><b>{t('teach.answers')}:</b> {tasks.map((x, i) => <span key={i}> {i + 1}) <Tex tex={x.answer} />;</span>)}</div>
        </section>
      )}
    </div>
  )
}
