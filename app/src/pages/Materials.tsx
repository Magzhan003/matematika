import { useMemo, useState, type ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { Tex } from '../components/Tex'
import { materialById, materials, trainer, trainerBook, type L, type Material, type MCQ, type SumWork } from '../data/materials'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { texValue, typedValue } from '../lib/numanswer'

const LETTERS = 'ABCD'
const figs = import.meta.glob('../assets/materials/*.webp', { eager: true, import: 'default' }) as Record<string, string>
const fig = (id: string) => figs[`../assets/materials/${id}.webp`]

/* ---------- results (kept in this browser) ---------- */
const RESULTS = 'materials-best'
function loadBest(): Record<string, number> { try { return JSON.parse(localStorage.getItem(RESULTS) || '{}') } catch { return {} } }
function saveBest(id: string, v: number) { try { const b = loadBest(); if ((b[id] ?? -1) < v) { b[id] = v; localStorage.setItem(RESULTS, JSON.stringify(b)) } } catch { /* storage off */ } }

function markOf(m: Material, correct: number): number | null {
  if (!m.scale) return null
  const [a, b, c] = m.scale
  return correct >= a ? 5 : correct >= b ? 4 : correct >= c ? 3 : 2
}
const count = (m: Material) => m.mcq?.length ?? m.free?.tasks.length ?? m.works?.length ?? 0

/* ---------- list ---------- */
type Filter = 'all' | 'school' | 'senior' | 'ent'
const inFilter = (m: Material, f: Filter) =>
  f === 'all' || (f === 'ent' ? m.grade === 'ent' : f === 'senior' ? m.grade !== 'ent' && m.grade >= 10 : m.grade !== 'ent' && m.grade < 10)

function MaterialCard({ m, lang }: { m: Material; lang: Lang }) {
  const { t } = useTranslation()
  const best = loadBest()[m.id]
  return (
    <Link to={`/materials?m=${m.id}`} className="card mat-card">
      <div className="mat-tags">
        <span className={`mat-kind k-${m.kind}`}>{t(`mat.kind.${m.kind}`)}</span>
        <span className="muted small">{m.grade === 'ent' ? t('mat.ent') : t('grade.n', { n: m.grade })} · {t(`mat.subj.${m.subject}`)}</span>
      </div>
      <b className="mat-title">{m.title[lang]}</b>
      <span className="muted small">
        {t(`mat.count.${m.kind}`, { n: count(m) })}{m.minutes ? ` · ${t('mat.min', { n: m.minutes })}` : ''}{m.author ? ` · ${m.author}` : ''}
      </span>
      {m.gen && <span className="mat-inf">∞ {t('mat.manyVariants')}</span>}
      {best !== undefined && m.mcq && <span className="mat-best">✓ {t('mat.best')}: {best} / {m.mcq.length}</span>}
    </Link>
  )
}

function TrainerTable({ lang, topic }: { lang: Lang; topic?: string }) {
  const { t } = useTranslation()
  const rows = topic ? trainer.filter((p) => p.topics.includes(topic)) : trainer
  if (!rows.length) return null
  return (
    <section className="card mat-trainer">
      <h2>{t('mat.trainer')}</h2>
      <p className="muted small">{trainerBook[lang]}. {t('mat.trainerNote')}</p>
      <div className="table-wrap">
        <table className="journal">
          <tbody>
            {rows.map((p) => (
              <tr key={p.ch}>
                <td><b>{p.ch}</b></td>
                <td>{p.title[lang]}<div className="chips" style={{ marginTop: 4 }}>{p.topics.map((id) => topicById(id) && <Link key={id} className="chip" to={`/practice/${id}`}>{topicById(id)!.title[lang]}</Link>)}</div></td>
                <td className="nowrap">{t('mat.pages', { a: p.from, b: p.to })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ---------- multiple-choice test ---------- */
function OptionText({ o, lang }: { o: L; lang: Lang }) { return <MathText text={o[lang]} /> }

function OnlineTest({ m, lang }: { m: Material; lang: Lang }) {
  const { t } = useTranslation()
  const qs = m.mcq!
  const [picked, setPicked] = useState<(number | null)[]>(() => qs.map(() => null))
  const [checked, setChecked] = useState(false)
  const correct = picked.filter((p, i) => p === qs[i].ans).length
  const answered = picked.filter((p) => p !== null).length
  const check = () => { setChecked(true); saveBest(m.id, correct); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const reset = () => { setPicked(qs.map(() => null)); setChecked(false) }
  const mark = markOf(m, correct)
  return (
    <div className="mat-test">
      {checked && (
        <div className={`card mat-result ${correct / qs.length >= 0.7 ? 'good' : ''}`} role="status">
          <b>{t('mat.score', { c: correct, n: qs.length })}</b>
          {mark !== null && <span>{t('mat.mark')}: <b>{mark}</b></span>}
          <button className="btn btn-sm" onClick={reset}>{t('mat.reset')}</button>
        </div>
      )}
      <ol className="mat-qs">
        {qs.map((q, i) => (
          <li key={i} className={`card mat-q ${checked ? (picked[i] === q.ans ? 'ok' : 'bad') : ''}`}>
            <div className="mat-qtext"><MathText text={q.q[lang]} /></div>
            <div className="mat-opts">
              {q.opts.map((o, k) => {
                const state = checked ? (k === q.ans ? 'right' : picked[i] === k ? 'wrong' : '') : picked[i] === k ? 'on' : ''
                return (
                  <button key={k} className={`mat-opt ${state}`} disabled={checked} aria-pressed={picked[i] === k}
                    onClick={() => setPicked(picked.map((p, j) => (j === i ? k : p)))}>
                    <span className="mat-letter">{LETTERS[k]}</span><OptionText o={o} lang={lang} />
                  </button>
                )
              })}
            </div>
            {checked && (
              <div className="mat-sol">
                <b>{picked[i] === q.ans ? `✓ ${t('mat.right')}` : `✗ ${t('mat.wrong', { a: LETTERS[q.ans] })}`}</b>
                {q.sol && <div><span className="muted">{t('mat.solution')}: </span><MathText text={q.sol[lang]} /></div>}
              </div>
            )}
          </li>
        ))}
      </ol>
      {!checked && (
        <div className="mat-bar">
          <span className="muted">{t('mat.answered', { a: answered, n: qs.length })}</span>
          <button className="btn btn-primary" onClick={check} disabled={!answered}>{t('mat.check')}</button>
        </div>
      )}
    </div>
  )
}

function Fields() {
  const { t } = useTranslation()
  return <div className="sheet-fields">{t('teach.name')} ______________________ {t('teach.class')} ______ {t('teach.date')} ________</div>
}

function TestPrint({ m, lang, variant }: { m: Material; lang: Lang; variant?: number }) {
  const { t } = useTranslation()
  const qs = m.mcq!
  const [parts, setParts] = useState({ sheet: true, key: true, sol: true })
  const short = (q: MCQ) => q.opts.every((o) => o[lang].replace(/\$[^$]*\$/g, 'xx').length <= 14)
  return (
    <div>
      <div className="no-print card mat-print-opts">
        <span className="muted">{t('mat.parts')}:</span>
        {(['sheet', 'key', 'sol'] as const).map((k) => (
          <label key={k} className="chip-check"><input type="checkbox" checked={parts[k]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} /> {t(`mat.print_${k}`)}</label>
        ))}
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 {t('mat.print')}</button>
      </div>
      <div className="print-area">
        <section className="sheet mat-sheet">
          <div className="sheet-head"><b>{m.title[lang]}</b><span className="small">{m.grade === 'ent' ? t('mat.ent') : t('grade.n', { n: m.grade })}{m.minutes ? ` · ${t('mat.min', { n: m.minutes })}` : ''}{variant ? ` · ${t('mat.variant', { n: variant })}` : ''}</span></div>
          <Fields />
          {m.intro && <p className="small" style={{ margin: '0 0 8px' }}>{m.intro[lang]}</p>}
          <ol className="mat-print-qs">
            {qs.map((q, i) => (
              <li key={i}>
                <MathText text={q.q[lang]} />
                <div className={`mat-print-opts-row ${short(q) ? 'four' : 'two'}`}>
                  {q.opts.map((o, k) => <span key={k}>{LETTERS[k]}) <OptionText o={o} lang={lang} /></span>)}
                </div>
              </li>
            ))}
          </ol>
        </section>
        {parts.sheet && (
          <section className="sheet mat-sheet">
            <div className="sheet-head"><b>{t('mat.print_sheet')}</b><span className="small">{m.title[lang]}</span></div>
            <Fields />
            <div className="mat-bubbles">
              {qs.map((_, i) => <div key={i}><b>{i + 1}</b>{LETTERS.split('').map((c) => <span key={c}>{c}</span>)}</div>)}
            </div>
            <p className="small">{t('mat.correctCount', { n: qs.length })}</p>
          </section>
        )}
        {parts.key && (
          <section className="sheet mat-sheet">
            <div className="sheet-head"><b>{t('mat.print_key')}</b><span className="small">{m.title[lang]}</span></div>
            <p className="small muted">{t('mat.keyNote')}</p>
            <div className="mat-keygrid">{qs.map((q, i) => <span key={i}><b>{i + 1}</b> {LETTERS[q.ans]}</span>)}</div>
            {m.scale && <p className="small">{t('mat.scaleNote', { a: m.scale[0], b: m.scale[1], c: m.scale[2] })}</p>}
            {parts.sol && (
              <ol className="mat-print-sols">
                {qs.map((q, i) => q.sol && <li key={i} value={i + 1}><b>{LETTERS[q.ans]})</b> <MathText text={q.sol[lang]} /></li>)}
              </ol>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function Theory({ m, lang }: { m: Material; lang: Lang }) {
  return (
    <div className="mat-theory">
      {m.theory!.map((b, i) => (
        <section key={i} className="card">
          <h2>{b.title[lang]}</h2>
          {b.rows && (
            <div className="table-wrap"><table className="journal mat-ttable"><tbody>
              {b.rows.map((r, k) => <tr key={k}><th><MathText text={r.name[lang]} /></th><td><MathText text={r.text[lang]} /></td></tr>)}
            </tbody></table></div>
          )}
          {b.paras?.map((p, k) => <p key={k}><MathText text={p[lang]} /></p>)}
          {b.tip && <div className="hint-box"><MathText text={b.tip[lang]} /></div>}
        </section>
      ))}
    </div>
  )
}

/* ---------- worksheet with typed answers ---------- */
function Worksheet({ m, lang }: { m: Material; lang: Lang }) {
  const { t } = useTranslation()
  const w = m.free!
  const [vals, setVals] = useState<string[]>(() => w.tasks.map(() => ''))
  const [checked, setChecked] = useState(false)
  const [show, setShow] = useState(false)
  const ok = (i: number) => { const v = typedValue(vals[i]), a = texValue(w.tasks[i].ans); return v !== null && a !== null && Math.abs(v - a) < 1e-9 }
  const correct = w.tasks.filter((_, i) => ok(i)).length
  return (
    <div className="mat-test">
      <p className="muted">{w.instruction[lang]} {t('mat.typeHint')}</p>
      {checked && <div className={`card mat-result ${correct / w.tasks.length >= 0.7 ? 'good' : ''}`}><b>{t('mat.score', { c: correct, n: w.tasks.length })}</b><button className="btn btn-sm" onClick={() => { setVals(w.tasks.map(() => '')); setChecked(false) }}>{t('mat.reset')}</button></div>}
      {w.groups.map((g, gi) => (
        <section key={gi}>
          <h3>{g[lang]}</h3>
          <div className="mat-free">
            {w.tasks.map((x, i) => x.group !== gi ? null : (
              <label key={i} className={`mat-free-item ${checked && vals[i].trim() ? (ok(i) ? 'ok' : 'bad') : ''}`}>
                <span className="mat-n">{i + 1})</span><Tex tex={x.q} />
                <input className="input" value={vals[i]} inputMode="text" aria-label={t('mat.yourAns')} disabled={checked}
                  onChange={(e) => setVals(vals.map((v, j) => (j === i ? e.target.value : v)))} />
                {(show || (checked && !ok(i))) && <span className="mat-free-ans">→ <Tex tex={x.ans} /></span>}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="mat-bar">
        <button className="btn" onClick={() => setShow(!show)}>{show ? t('mat.hideAns') : t('mat.showAns')}</button>
        {!checked && <button className="btn btn-primary" onClick={() => { setChecked(true); saveBest(m.id, correct) }} disabled={!vals.some((v) => v.trim())}>{t('mat.check')}</button>}
      </div>
    </div>
  )
}

function WorksheetPrint({ m, lang }: { m: Material; lang: Lang }) {
  const { t } = useTranslation()
  const w = m.free!
  return (
    <div>
      <div className="no-print card mat-print-opts"><button className="btn btn-primary" onClick={() => window.print()}>🖨 {t('mat.print')}</button></div>
      <div className="print-area">
        <section className="sheet mat-sheet">
          <div className="sheet-head"><b>{m.title[lang]}</b><span className="small">{t('grade.n', { n: m.grade })}</span></div>
          <Fields />
          <p className="small" style={{ margin: '0 0 6px' }}>{w.instruction[lang]}</p>
          {w.groups.map((g, gi) => (
            <div key={gi} className="mat-ws-group">
              <b className="small">{g[lang]}</b>
              <div className="mat-ws-cols">{w.tasks.map((x, i) => x.group === gi && <div key={i}>{i + 1}) <Tex tex={x.q} /> ______</div>)}</div>
            </div>
          ))}
        </section>
        <section className="sheet mat-sheet">
          <div className="sheet-head"><b>{t('mat.print_key')}</b><span className="small">{m.title[lang]}</span></div>
          <div className="mat-keygrid wide">{w.tasks.map((x, i) => <span key={i}><b>{i + 1})</b> <Tex tex={x.ans} /></span>)}</div>
        </section>
      </div>
    </div>
  )
}

/* ---------- summative works (БЖБ / ТЖБ) ---------- */
const workName = (w: SumWork, t: TFunction) => (w.kind === 'bzb' ? t('mat.bzb', { n: w.n }) : t('mat.tzb'))

function WorkHeader({ w, lang }: { w: SumWork; lang: Lang }) {
  const { t } = useTranslation()
  const rows: [string, ReactNode][] = w.kind === 'bzb'
    ? [
        [t('mat.topic'), w.topic?.[lang]],
        [t('mat.goals'), w.goals?.map((g, i) => <div key={i}><MathText text={g[lang]} /></div>)],
        [t('mat.criteria'), <><div>{t('mat.learner')}</div>{w.criteria?.map((c, i) => <div key={i}>▪ {c[lang]}</div>)}</>],
        [t('mat.skills'), w.skills?.[lang]],
        [t('mat.time'), t('mat.min', { n: w.minutes })],
      ]
    : [
        [t('mat.duration'), t('mat.min', { n: w.minutes })],
        [t('mat.points'), w.points],
        [t('mat.types'), t('mat.typesText')],
        [t('mat.structure'), t('mat.structureText', { n: w.tasks.length })],
        [t('mat.goals'), w.goals?.[0][lang]],
      ]
  return <table className="mat-wtable"><tbody>{rows.map(([k, v], i) => <tr key={i}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
}

function WorkTasks({ w, lang }: { w: SumWork; lang: Lang }) {
  const { t } = useTranslation()
  return (
    <ol className="mat-wtasks">
      {w.tasks.map((x, i) => (
        <li key={i}>
          <div className="mat-wtask-head"><span className={`lvl ${x.level.toLowerCase()}`}>{x.level}</span>{x.basis && <span className="muted small">{t('mat.basis', { b: x.basis })}</span>}{x.pts !== undefined && <span className="mat-pts">[{x.pts}]</span>}</div>
          {x.text[lang] && <div><MathText text={x.text[lang]} /></div>}
          {x.fig && fig(x.fig) && <img className="mat-fig" src={fig(x.fig)} alt="" loading="lazy" />}
          {x.parts?.map((p, k) => <div key={k} className="mat-part"><MathText text={p[lang]} /></div>)}
        </li>
      ))}
    </ol>
  )
}

function WorkDescriptors({ w, lang }: { w: SumWork; lang: Lang }) {
  const { t } = useTranslation()
  const total = w.descriptors.reduce((s, d) => s + d.rows.reduce((a, r) => a + r.pts, 0), 0)
  return (
    <table className="mat-dtable">
      <thead><tr><th>{t('mat.crit')}</th><th>№</th><th>{t('mat.descriptor')}</th><th>{t('mat.pts')}</th></tr></thead>
      <tbody>
        <tr><td colSpan={4} className="muted small">{t('mat.learner')}</td></tr>
        {w.descriptors.map((d, i) => d.rows.map((r, k) => (
          <tr key={`${i}-${k}`}>
            {k === 0 && <td rowSpan={d.rows.length}>{d.crit[lang]}</td>}
            <td className="nowrap">{r.n}</td><td><MathText text={r.text[lang]} /></td><td className="c">{r.pts}</td>
          </tr>
        )))}
        <tr><td colSpan={3}><b>{t('mat.total')}:</b></td><td className="c"><b>{total}</b></td></tr>
      </tbody>
    </table>
  )
}

function WorkKey({ w, lang }: { w: SumWork; lang: Lang }) {
  return (
    <div className="mat-key">
      {w.key.map((k, i) => <p key={i}><MathText text={k[lang]} /></p>)}
      {w.keyFigs?.map((f) => fig(f) && <img key={f} className="mat-fig" src={fig(f)} alt="" loading="lazy" />)}
    </div>
  )
}

function WorkRubric({ w, lang }: { w: SumWork; lang: Lang }) {
  const { t } = useTranslation()
  if (!w.rubric) return null
  return (
    <table className="mat-dtable">
      <thead><tr><th>{t('mat.crit')}</th><th>{t('mat.low')}</th><th>{t('mat.mid')}</th><th>{t('mat.high')}</th></tr></thead>
      <tbody>{w.rubric.map((r, i) => <tr key={i}><td>{r.crit[lang]}</td><td><MathText text={r.low[lang]} /> ☐</td><td><MathText text={r.mid[lang]} /> ☐</td><td><MathText text={r.high[lang]} /> ☐</td></tr>)}</tbody>
    </table>
  )
}

function Summative({ m, lang }: { m: Material; lang: Lang }) {
  const { t } = useTranslation()
  const works = m.works!
  const [params, setParams] = useSearchParams()
  const id = params.get('w') ?? works[0].id
  const w = works.find((x) => x.id === id) ?? works[0]
  const [parts, setParts] = useState({ tasks: true, desc: true, key: true, rubric: false })
  const pick = (wid: string) => { const p = new URLSearchParams(params); p.set('w', wid); setParams(p, { replace: true }) }
  const quarters = [1, 2, 3, 4]
  const heading = `${workName(w, t)}${w.kind === 'bzb' ? ` «${w.title[lang]}»` : ` · ${t('mat.quarter', { n: w.quarter })}`}`
  return (
    <div>
      <div className="no-print">
        {m.book && <p className="muted small">{t('mat.book')}: {m.book[lang]}</p>}
        <div className="mat-quarters">
          {quarters.map((q) => (
            <div key={q} className="mat-quarter">
              <span className="muted small">{t('mat.quarter', { n: q })}</span>
              <div className="chips">
                {works.filter((x) => x.quarter === q).map((x) => (
                  <button key={x.id} className={`chip ${x.id === w.id ? 'on' : ''}`} onClick={() => pick(x.id)} title={x.title[lang]}>{workName(x, t)}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card mat-print-opts">
          <span className="muted">{t('mat.parts')}:</span>
          {(['tasks', 'desc', 'key', 'rubric'] as const).map((k) => (k !== 'rubric' || w.rubric) && (
            <label key={k} className="chip-check"><input type="checkbox" checked={parts[k]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} /> {t(`mat.part_${k}`)}</label>
          ))}
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 {t('mat.print')}</button>
        </div>
      </div>
      <div className="print-area">
        {parts.tasks && (
          <section className="sheet mat-sheet">
            <div className="sheet-head"><b>{heading}</b><span className="small">{t('grade.n', { n: 10 })} · {w.points} {t('mat.pts').toLowerCase()} · {t('mat.min', { n: w.minutes })}</span></div>
            <Fields />
            <WorkHeader w={w} lang={lang} />
            <h3 className="mat-h3">{t('mat.tasks')}</h3>
            <WorkTasks w={w} lang={lang} />
          </section>
        )}
        {parts.desc && (
          <section className="sheet mat-sheet">
            <div className="sheet-head"><b>{w.kind === 'bzb' ? t('mat.descriptors') : t('mat.scoring')}</b><span className="small">{heading}</span></div>
            <WorkDescriptors w={w} lang={lang} />
          </section>
        )}
        {parts.key && (
          <section className="sheet mat-sheet">
            <div className="sheet-head"><b>{t('mat.key')}</b><span className="small">{heading}</span></div>
            <WorkKey w={w} lang={lang} />
          </section>
        )}
        {parts.rubric && w.rubric && (
          <section className="sheet mat-sheet">
            <div className="sheet-head"><b>{t('mat.rubric')}</b><span className="small">{heading}</span></div>
            <Fields />
            <WorkRubric w={w} lang={lang} />
          </section>
        )}
      </div>
    </div>
  )
}

/* ---------- one material ---------- */
type Tab = 'theory' | 'test' | 'print'
function MaterialView({ m: base, lang }: { m: Material; lang: Lang }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const seed = Math.max(1, Number(params.get('v')) || 1)
  const m = useMemo(() => (base.gen ? { ...base, mcq: base.gen(seed) } : base), [base, seed])
  const newVariant = () => { const p = new URLSearchParams(params); p.set('v', String(Math.floor(Math.random() * 9000) + 2)); setParams(p, { replace: true }) }
  const tabs: Tab[] = m.kind === 'summative' ? [] : [...(m.theory ? ['theory' as const] : []), 'test', 'print']
  const [tab, setTab] = useState<Tab>(m.theory ? 'theory' : 'test')
  return (
    <div className="page mat-page">
      <div className="no-print">
        <Link to="/materials" className="muted small">{t('mat.back')}</Link>
        <h1 style={{ margin: '6px 0 4px' }}>{m.title[lang]}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {m.grade === 'ent' ? t('mat.ent') : t('grade.n', { n: m.grade })} · {t(`mat.kind.${m.kind}`)} · {t(`mat.count.${m.kind}`, { n: count(m) })}
          {m.minutes ? ` · ${t('mat.min', { n: m.minutes })}` : ''}{m.author ? ` · ${t('mat.author')}: ${m.author}` : ''}
        </p>
        {m.intro && <p style={{ maxWidth: 820 }}>{m.intro[lang]}</p>}
        {m.source && <p className="muted small" style={{ maxWidth: 820 }}>📘 {m.source[lang]}</p>}
        {m.gen && (
          <div className="mat-variant">
            <span>{t('mat.variant', { n: seed })}</span>
            <button className="btn btn-sm" onClick={newVariant}>🎲 {t('mat.newVariant')}</button>
          </div>
        )}
        {tabs.length > 0 && (
          <div className="calc-tabs" role="tablist">
            {tabs.map((x) => <button key={x} role="tab" aria-selected={tab === x} className={`calc-tab ${tab === x ? 'on' : ''}`} onClick={() => setTab(x)}>{t(`mat.tab_${x}${x === 'test' && m.kind === 'worksheet' ? 'Ws' : ''}`)}</button>)}
          </div>
        )}
      </div>
      {m.kind === 'summative' && <Summative m={m} lang={lang} />}
      {m.kind !== 'summative' && tab === 'theory' && <Theory m={m} lang={lang} />}
      {m.kind === 'test' && tab === 'test' && <OnlineTest key={`${m.id}-${seed}`} m={m} lang={lang} />}
      {m.kind === 'test' && tab === 'print' && <TestPrint m={m} lang={lang} variant={m.gen ? seed : undefined} />}
      {m.kind === 'worksheet' && tab === 'test' && <Worksheet key={m.id} m={m} lang={lang} />}
      {m.kind === 'worksheet' && tab === 'print' && <WorksheetPrint m={m} lang={lang} />}
    </div>
  )
}

/** «Дайын материалдар»: teachers' ready tests, worksheets and summative works — solve online or print with a key. */
export function Materials() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const [params] = useSearchParams()
  const open = params.get('m')
  const m = open ? materialById(open) : undefined
  const [filter, setFilter] = useState<Filter>('all')
  const list = useMemo(() => materials.filter((x) => inFilter(x, filter)), [filter])
  if (m) return <MaterialView m={m} lang={lang} />
  return (
    <div className="page mat-page">
      <h1>{t('mat.title')}</h1>
      <p className="muted">{t('mat.intro')}</p>
      <div className="chips" style={{ margin: '4px 0 14px' }}>
        {(['all', 'school', 'senior', 'ent'] as const).map((f) => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{t(`mat.f_${f}`)}</button>)}
      </div>
      <div className="mat-grid">{list.map((x) => <MaterialCard key={x.id} m={x} lang={lang} />)}</div>
      <TrainerTable lang={lang} />
    </div>
  )
}

/** Small block for a topic page: ready materials and trainer pages for this topic. */
export function TopicMaterials({ topic }: { topic: string }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const list = materials.filter((m) => m.topics.includes(topic))
  const pages = trainer.filter((p) => p.topics.includes(topic))
  if (!list.length && !pages.length) return null
  return (
    <div className="card mat-topic">
      <h3 style={{ margin: 0 }}>{t('mat.forTopic')}</h3>
      {list.length > 0 && <div className="chips">{list.map((m) => <Link key={m.id} className="chip" to={`/materials?m=${m.id}`}>{t(`mat.kind.${m.kind}`)}: {m.title[lang]}</Link>)}</div>}
      {pages.length > 0 && <div className="muted small">{t('mat.trainerShort')}: {pages.map((p) => `${p.ch} (${t('mat.pages', { a: p.from, b: p.to })})`).join('; ')}</div>}
    </div>
  )
}
