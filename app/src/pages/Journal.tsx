import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { decodeResult, decodeWork, type Result } from '../lib/workcode'

type Row = { name: string; code: string }
const CODE = /r[0-9a-z]{3}-?[0-9a-z]{4}-?[0-9a-z]{4}-?[0-9a-z]{4}/i
const keyOf = (seed: number) => `journal:${seed}`

function load(seed: number): Row[] {
  try {
    return JSON.parse(localStorage.getItem(keyOf(seed)) ?? '[]')
  } catch {
    return []
  }
}

/** 5-point school mark from the percentage (85 / 65 / 40). */
const mark = (p: number) => (p >= 85 ? 5 : p >= 65 ? 4 : p >= 40 ? 3 : 2)

/** Teacher's journal: paste the result codes the students sent, get a table and the hardest tasks. */
export function Journal() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(params.get('c') ?? '')
  const work = useMemo(() => decodeWork(code), [code])
  const [rows, setRows] = useState<Row[]>([])
  const [paste, setPaste] = useState('')
  const [problems, setProblems] = useState<string[]>([])

  useEffect(() => {
    if (work) setRows(load(work.seed))
  }, [work])
  const save = (r: Row[]) => {
    setRows(r)
    if (work) localStorage.setItem(keyOf(work.seed), JSON.stringify(r))
  }

  const add = () => {
    const bad: string[] = []
    const next = [...rows]
    for (const line of paste.split('\n').map((s) => s.trim()).filter(Boolean)) {
      const m = line.match(CODE)
      const res = m && decodeResult(m[0])
      if (!m || !res || res.seed !== work!.seed || res.ok.length !== work!.types.length) {
        bad.push(line)
        continue
      }
      const name = line.replace(m[0], '').replace(/^[\s—–:,-]+|[\s—–:,-]+$/g, '') || t('jr.noName')
      if (!next.some((r) => r.code.toLowerCase() === m[0].toLowerCase())) next.push({ name, code: m[0].toUpperCase() })
    }
    save(next)
    setPaste(bad.join('\n'))
    setProblems(bad)
  }

  const table = rows
    .map((r) => ({ ...r, res: decodeResult(r.code) as Result }))
    .filter((r) => r.res)
    .sort((a, b) => a.name.localeCompare(b.name))
  const n = work?.types.length ?? 0
  const perTask = Array.from({ length: n }, (_, i) => table.filter((r) => r.res.ok[i]).length)

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
    a.download = `journal-${work!.seed}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t('jr.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('jr.intro')}</p>
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <label className="field">
          <span className="muted small">{t('work.code')}</span>
          <input className="input code-input" value={code} onChange={(e) => { setCode(e.target.value); setParams({ c: e.target.value }, { replace: true }) }} />
        </label>
        {code && !work && <p className="error" style={{ margin: 0 }}>{t('work.badCode')}</p>}
        {work && (
          <>
            <div className="muted small">{t('jr.tasks', { n })}: {work.types.map((g, i) => `${i + 1}) ${topicById(g.topic)?.title[lang] ?? g.id}`).join(' · ')}</div>
            <label className="field">
              <span className="muted small">{t('jr.paste')}</span>
              <textarea className="input" rows={4} value={paste} placeholder={t('jr.pasteHint')} onChange={(e) => setPaste(e.target.value)} />
            </label>
            {problems.length > 0 && <p className="error" style={{ margin: 0 }}>{t('jr.badLines', { n: problems.length })}</p>}
            <div><button className="btn btn-primary" disabled={!paste.trim()} onClick={add}>{t('jr.add')}</button></div>
          </>
        )}
      </div>

      {work && table.length > 0 && (
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
                      <td><button className="btn btn-sm" aria-label={t('jr.remove')} onClick={() => save(rows.filter((x) => x.code !== r.code))}>✕</button></td>
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
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={exportCsv}>⬇ {t('jr.csv')}</button>
            <button className="btn" onClick={() => window.confirm(t('jr.confirmClear')) && save([])}>🗑 {t('jr.clear')}</button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>{t('jr.markNote')}</p>
        </>
      )}
    </div>
  )
}
