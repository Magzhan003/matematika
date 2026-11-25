import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ProblemVisual } from '../components/ProblemVisual'
import { Solution } from '../components/ProblemCard'
import { Tex } from '../components/Tex'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { decodeResult, decodeWork, variantProblems, type Work } from '../lib/workcode'
import { allWorks, avgPercent, CODE, keyOf, load, mark, results, store, today, type Entry } from '../lib/journal'
import { setWorkOpen, useCloudJournal } from '../lib/cloud'

/** Teacher's journal: all class works, results by student and task, and the tasks with answers. */
export function Journal() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const code = params.get('c') ?? ''
  const work = useMemo(() => decodeWork(code), [code])
  const [codeInput, setCodeInput] = useState('')
  const [, refresh] = useState(0)
  // online: answers come from the database; works given to a class can be closed
  const cj = useCloudJournal()

  if (work) return <WorkView key={work.seed} work={work} code={code} title={params.get('t') ?? ''} onBack={() => setParams({})} />

  const list = allWorks()
  const open = (c: string) => setParams({ c: c.toUpperCase() })
  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t('jr.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('jr.intro')}</p>
      <form className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}
        onSubmit={(e) => { e.preventDefault(); if (decodeWork(codeInput)) open(codeInput) }}>
        <label className="field" style={{ flex: '1 1 260px' }}>
          <span className="muted small">{t('jr.openByCode')}</span>
          <input className="input code-input" value={codeInput} placeholder="WABC-D123-…" onChange={(e) => setCodeInput(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={!decodeWork(codeInput)}>{t('jr.open')}</button>
        <Link className="btn" to="/teacher">➕ {t('jr.newWork')}</Link>
        {codeInput && !decodeWork(codeInput) && <p className="error" style={{ margin: 0, flexBasis: '100%' }}>{t('work.badCode')}</p>}
      </form>

      <h2 style={{ margin: '6px 0 0' }}>{t('jr.myWorks')} ({list.length})</h2>
      {list.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('jr.noWorks')}</p>}
      <div className="jr-list">
        {list.map(({ seed, e }) => {
          const avg = avgPercent(e)
          const n = results(e.rows).length
          return (
            <div key={seed} className="card jr-item">
              <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                <b>{e.title || t('jr.untitled')}</b>
                <span className="muted small">{e.created || '—'} · {e.code || t('jr.unknownCode')}</span>
                <span className="small">{t('jr.students', { n })}{avg !== null ? ` · ${t('jr.avg', { p: avg })}` : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cj.works.filter((w) => w.code === e.code).map((w) => (
                  <button key={w.id} className={`btn btn-sm ${w.open ? '' : 'jr-closed'}`} title={t('cl.toggleOpen')}
                    onClick={async () => { await setWorkOpen(w.id, !w.open); cj.reload() }}>{w.open ? `🟢 ${t('cl.accepting')}` : `🔒 ${t('cl.closed')}`}</button>
                ))}
                {e.code ? <button className="btn btn-sm btn-primary" onClick={() => open(e.code)}>{t('jr.open')}</button>
                  : <span className="muted small">{t('jr.needCode')}</span>}
                <button className="btn btn-sm" aria-label={t('jr.deleteWork')} title={t('jr.deleteWork')}
                  onClick={() => { if (window.confirm(t('jr.confirmDelete', { title: e.title || e.code }))) { localStorage.removeItem(keyOf(seed)); refresh((x) => x + 1) } }}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WorkView({ work, code, title, onBack }: { work: Work; code: string; title: string; onBack: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  // opening a work registers it in the list (with the title sent by the generator)
  const [entry, setEntry] = useState<Entry>(() => {
    const e = load(work.seed)
    const fallback = title || t('jr.defaultTitle', { date: today() })
    const fixed: Entry = e
      ? { ...e, code: e.code || code.toUpperCase(), title: e.title || fallback, created: e.created || today() }
      : { code: code.toUpperCase(), title: fallback, created: today(), rows: [] }
    store(work.seed, fixed)
    return fixed
  })
  const [tab, setTab] = useState<'results' | 'tasks'>('results')
  const [paste, setPaste] = useState('')
  const [problems, setProblems] = useState<string[]>([])
  const [variant, setVariant] = useState(0)
  const [openSol, setOpenSol] = useState<number | null>(null)
  const tasks = useMemo(() => variantProblems(work, variant), [work, variant])

  const save = (e: Entry) => { setEntry(e); store(work.seed, e) }
  const rows = entry.rows

  const add = () => {
    const bad: string[] = []
    const next = [...rows]
    for (const line of paste.split('\n').map((s) => s.trim()).filter(Boolean)) {
      const m = line.match(CODE)
      const res = m && decodeResult(m[0])
      if (!m || !res || res.seed !== work.seed || res.ok.length !== work.types.length) {
        bad.push(line)
        continue
      }
      const name = line.replace(m[0], '').replace(/^[\s—–:,-]+|[\s—–:,-]+$/g, '') || t('jr.noName')
      if (!next.some((r) => r.code.toLowerCase() === m[0].toLowerCase())) next.push({ name, code: m[0].toUpperCase() })
    }
    save({ ...entry, rows: next })
    setPaste(bad.join('\n'))
    setProblems(bad)
  }

  const table = results(rows).sort((a, b) => a.name.localeCompare(b.name))
  const n = work.types.length
  const perTask = Array.from({ length: n }, (_, i) => table.filter((r) => r.res.ok[i]).length)
  // which variants the students actually solved
  const variantsUsed = Math.max(1, ...table.map((r) => r.res.variant + 1))

  const exportCsv = () => {
    const head = [t('jr.student'), t('jr.variant'), ...Array.from({ length: n }, (_, i) => `#${i + 1}`), t('jr.points'), '%', t('jr.mark'), t('jr.minutes')]
    const lines = table.map((r) => {
      const s = r.res.ok.filter(Boolean).length
      const p = Math.round((s / n) * 100)
      return [r.name, r.res.variant + 1, ...r.res.ok.map((x) => (x ? 1 : 0)), s, p, mark(p), r.res.minutes]
    })
    const csv = '﻿' + [head, ...lines].map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `journal-${(entry.title || String(work.seed)).replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <div>
        <button className="link-btn muted small" onClick={onBack}>← {t('jr.allWorks')}</button>
        <input className="input jr-title" value={entry.title} aria-label={t('jr.workTitle')} placeholder={t('jr.workTitle')}
          onChange={(e) => save({ ...entry, title: e.target.value })} />
        <div className="muted small">{t('jr.createdOn', { date: entry.created || '—' })} · {t('work.code')}: <b className="code-input">{code.toUpperCase()}</b></div>
      </div>

      <div className="calc-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'results'} className={`calc-tab ${tab === 'results' ? 'on' : ''}`} onClick={() => setTab('results')}>📋 {t('jr.tabResults')} ({table.length})</button>
        <button role="tab" aria-selected={tab === 'tasks'} className={`calc-tab ${tab === 'tasks' ? 'on' : ''}`} onClick={() => setTab('tasks')}>📝 {t('jr.tabTasks')}</button>
      </div>

      {tab === 'tasks' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="muted" style={{ margin: 0 }}>{t('jr.tasksIntro')}</p>
          <div className="chips">
            {[0, 1, 2, 3].map((v) => (
              <button key={v} className={`chip ${variant === v ? 'on' : ''}`} onClick={() => { setVariant(v); setOpenSol(null) }}>
                {t('teach.variant', { n: v + 1 })}{v < variantsUsed && table.some((r) => r.res.variant === v) ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <ol className="work-list">
            {tasks.map((p, i) => {
              const solvedBy = table.filter((r) => r.res.variant === variant)
              const ok = solvedBy.filter((r) => r.res.ok[i]).length
              return (
                <li key={i} className="card work-item">
                  <div className="problem-text">{p.text[lang]}</div>
                  {p.tex && <div className="problem-tex"><Tex tex={p.tex} /></div>}
                  <ProblemVisual p={p} />
                  <div className="answer">{t('steps.answer')}: <Tex tex={p.answer} /></div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="muted small">{topicById(p.topic)?.title[lang]}</span>
                    {solvedBy.length > 0 && <span className="small">{t('jr.solvedHere', { ok, n: solvedBy.length })}</span>}
                    <button className="btn btn-sm" onClick={() => setOpenSol(openSol === i ? null : i)}>{openSol === i ? t('pc.hideSolution') : t('pc.showSolution')}</button>
                  </div>
                  {openSol === i && <Solution p={p} />}
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {tab === 'results' && (
        <>
          <div className="card" style={{ display: 'grid', gap: 12 }}>
            <div className="muted small">{t('jr.tasks', { n })}: {work.types.map((g, i) => `${i + 1}) ${topicById(g.topic)?.title[lang] ?? g.id}`).join(' · ')}</div>
            <label className="field">
              <span className="muted small">{t('jr.paste')}</span>
              <textarea className="input" rows={4} value={paste} placeholder={t('jr.pasteHint')} onChange={(e) => setPaste(e.target.value)} />
            </label>
            {problems.length > 0 && <p className="error" style={{ margin: 0 }}>{t('jr.badLines', { n: problems.length })}</p>}
            <div><button className="btn btn-primary" disabled={!paste.trim()} onClick={add}>{t('jr.add')}</button></div>
          </div>

          {table.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('jr.noResults')}</p>}
          {table.length > 0 && (
            <>
              <div className="table-wrap">
                <table className="journal">
                  <thead>
                    <tr>
                      <th>{t('jr.student')}</th><th>{t('jr.variant')}</th>
                      {Array.from({ length: n }, (_, i) => <th key={i}>{i + 1}</th>)}
                      <th>{t('jr.points')}</th><th>%</th><th>{t('jr.mark')}</th><th>{t('jr.minutes')}</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((r) => {
                      const s = r.res.ok.filter(Boolean).length
                      const p = Math.round((s / n) * 100)
                      return (
                        <tr key={r.code}>
                          <td>{r.name}</td><td>{r.res.variant + 1}</td>
                          {r.res.ok.map((x, i) => <td key={i} className={x ? 'ok' : 'bad'}>{x ? '✓' : '✗'}</td>)}
                          <td>{s}/{n}</td><td>{p}</td><td><b>{mark(p)}</b></td><td>{r.res.minutes}</td>
                          <td><button className="btn btn-sm" aria-label={t('jr.remove')} onClick={() => save({ ...entry, rows: rows.filter((x) => x.code !== r.code) })}>✕</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>{t('jr.solvedBy')}</td>
                      {perTask.map((c, i) => {
                        const p = Math.round((c / table.length) * 100)
                        return <td key={i} className={p < 50 ? 'bad' : ''} title={`${c}/${table.length}`}>{p}%</td>
                      })}
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                </table>
              </div>
              {perTask.some((c) => c / table.length < 0.5) && (
                <div className="hint-box">
                  💡 {t('jr.hard')}: {perTask.map((c, i) => (c / table.length < 0.5 ? `№${i + 1} (${topicById(work.types[i].topic)?.title[lang]})` : '')).filter(Boolean).join(', ')}
                  {' '}<button className="link-btn" onClick={() => setTab('tasks')}>{t('jr.seeTasks')}</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn" onClick={exportCsv}>⬇ {t('jr.csv')}</button>
                <button className="btn" onClick={() => window.confirm(t('jr.confirmClear')) && save({ ...entry, rows: [] })}>🗑 {t('jr.clear')}</button>
              </div>
              <p className="muted small" style={{ margin: 0 }}>{t('jr.markNote')}</p>
            </>
          )}
        </>
      )}
    </div>
  )
}
