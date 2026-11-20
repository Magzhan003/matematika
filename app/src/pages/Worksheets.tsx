import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProblemVisual } from '../components/ProblemVisual'
import { Tex } from '../components/Tex'
import type { Level } from '../data/formulas'
import { sections, topicById, type Section } from '../data/topics'
import type { Lang } from '../i18n'
import { choices, gens, gensFor, pickGens, seeded, type Gen, type Problem, type Rng } from '../lib/bank'

type Kind = 'drill' | 'cipher' | 'mistakes' | 'cards'
const kinds: Kind[] = ['drill', 'cipher', 'mistakes', 'cards']
const icons: Record<Kind, string> = { drill: '🏋', cipher: '🔐', mistakes: '🔎', cards: '✂' }
const levels: Level[] = ['easy', 'medium', 'hard']

/** Words for the code-breaking sheet (letters only, no repeats needed). */
const WORDS: Record<Lang, string[]> = {
  ru: ['МАТЕМАТИКА', 'УРАВНЕНИЕ', 'ДРОБЬ', 'ФУНКЦИЯ', 'ПИФАГОР', 'ТРЕУГОЛЬНИК', 'КОРЕНЬ', 'ВЕКТОР', 'ПРОЦЕНТ', 'МОЛОДЦЫ', 'ОТЛИЧНО', 'ГРАФИК', 'ПАРАБОЛА', 'ЗНАНИЕ СИЛА'],
  kz: ['МАТЕМАТИКА', 'ТЕҢДЕУ', 'БӨЛШЕК', 'ФУНКЦИЯ', 'ПИФАГОР', 'ҮШБҰРЫШ', 'ТҮБІР', 'ВЕКТОР', 'ПАЙЫЗ', 'ЖАРАЙСЫҢ', 'КЕРЕМЕТ', 'ГРАФИК', 'ПАРАБОЛА', 'БІЛІМ КҮШ'],
}
const ALPHA: Record<Lang, string> = { ru: 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ', kz: 'АӘБВГҒДЕЖЗИКҚЛМНҢОӨПРСТУҰҮФХЫІЮЯ' }

/** One sample problem of a generator, to see what kind of tasks it makes. */
const sample = (g: Gen) => g.make(seeded(7))
const shortAnswer = (p: Problem) => p.values?.length === 1 && !p.visual && p.answer.length <= 18
/** «x = 14» → «14»: the table shows only the value, so equal answers look equal. */
const bare = (tex: string) => tex.replace(/^\s*[a-zA-Z](?:_\{?\d\}?)?\s*=\s*/, '').trim()
const hasMistakes = (p: Problem) => (p.mistakes ?? []).some((m) => m.tex !== p.answer)
const shuffle = <T,>(a: T[], r: Rng) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[b[i], b[j]] = [b[j], b[i]] } return b }

function Statement({ p, lang }: { p: Problem; lang: Lang }) {
  return <span className="pr-body">{p.text[lang]} {p.tex && <Tex tex={p.tex} />}<ProblemVisual p={p} /></span>
}

type Cipher = { word: string; tasks: { p: Problem; letter: string }[]; table: { answer: string; letter: string }[] }
type MistakeTask = { p: Problem; shown: string; right: boolean; why?: string }

export function Worksheets() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const [kind, setKind] = useState<Kind>('drill')
  const [title, setTitle] = useState('')
  const [secs, setSecs] = useState<Section[]>(['arithmetic'])
  const [level, setLevel] = useState<Level>('easy')
  const [count, setCount] = useState(20)
  const [cards, setCards] = useState(8)
  const [word, setWord] = useState('')
  const [seed, setSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000))
  const [withKey, setWithKey] = useState(true)

  const secWithGens = sections.filter((s) => gens.some((g) => topicById(g.topic)?.section === s))
  const pool = useMemo(() => {
    const base = gensFor({ sections: secs, level }).filter((g) => !sample(g).visual)
    if (kind === 'cipher') return base.filter((g) => shortAnswer(sample(g)))
    if (kind === 'mistakes') return base.filter((g) => hasMistakes(sample(g)))
    return base
  }, [secs, level, kind])

  const heading = title.trim() || t(`ws.kinds.${kind}`)
  const toggle = (s: Section) => setSecs(secs.includes(s) ? secs.filter((x) => x !== s) : [...secs, s])

  // ---- build the sheet (everything depends on the seed, so «Новые числа» gives a new sheet) ----
  const drill = useMemo(() => {
    if (kind !== 'drill' || !pool.length) return []
    const r = seeded(seed)
    return pickGens(pool, count, r).map((g) => g.make(r))
  }, [kind, pool, count, seed])

  const cipher = useMemo<Cipher | null>(() => {
    if (kind !== 'cipher' || !pool.length) return null
    const r = seeded(seed)
    const w = (word.trim() || WORDS[lang][Math.floor(r() * WORDS[lang].length)]).toUpperCase().slice(0, 16)
    const letters = [...w].filter((c) => c.trim())
    // one task per letter; every answer must lead to exactly one letter
    const byAnswer = new Map<string, string>()
    const tasks: Cipher['tasks'] = []
    const gl = pickGens(pool, letters.length * 3, r)
    let gi = 0
    for (const letter of letters) {
      let p: Problem | null = null
      for (let tries = 0; tries < 40 && !p; tries++) {
        const q = gl[gi++ % gl.length].make(r)
        const owner = byAnswer.get(bare(q.answer))
        if (owner === undefined || owner === letter) p = q
      }
      if (!p) return null
      byAnswer.set(bare(p.answer), letter)
      tasks.push({ p, letter })
    }
    // decoy answers with letters that are not in the word
    const free = shuffle([...ALPHA[lang]].filter((c) => !letters.includes(c)), r)
    const decoys: { answer: string; letter: string }[] = []
    for (const { p } of tasks) {
      for (const raw of choices(p, r, 3).options) {
        const o = bare(raw)
        // no ugly decimals like 2,1333 and nothing that equals a real answer
        if (decoys.length >= Math.min(8, free.length) || byAnswer.has(o) || /\d[.,{}]*\d{3,}/.test(o.replace(/^-?\d+/, ''))) continue
        byAnswer.set(o, free[decoys.length]); decoys.push({ answer: o, letter: free[decoys.length] })
      }
    }
    const real = [...new Map(tasks.map((x) => [bare(x.p.answer), x.letter])).entries()].map(([answer, letter]) => ({ answer, letter }))
    return { word: w, tasks, table: shuffle([...real, ...decoys], r) }
  }, [kind, pool, seed, word, lang])

  const mistakes = useMemo<MistakeTask[]>(() => {
    if (kind !== 'mistakes' || !pool.length) return []
    const r = seeded(seed)
    return pickGens(pool, Math.min(count, 12), r).map((g, i) => {
      const p = g.make(r)
      const list = (p.mistakes ?? []).filter((m) => m.tex !== p.answer)
      // about a third of the solutions are right, so the student really has to check
      if (!list.length || (i % 3 === 2)) return { p, shown: p.answer, right: true }
      const m = list[Math.floor(r() * list.length)]
      return { p, shown: m.tex, right: false, why: m.why }
    })
  }, [kind, pool, count, seed])

  const cardSets = useMemo(() => {
    if (kind !== 'cards' || !pool.length) return []
    const r = seeded(seed)
    const types = pickGens(pool, 3, r)
    return Array.from({ length: cards }, (_, c) => { const rc = seeded(seed * 31 + c + 1); return types.map((g) => g.make(rc)) })
  }, [kind, pool, cards, seed])

  const ready = kind === 'drill' ? drill.length > 0 : kind === 'cipher' ? !!cipher : kind === 'mistakes' ? mistakes.length > 0 : cardSets.length > 0
  const fields = <div className="sheet-fields">{t('teach.name')} ______________________ {t('teach.class')} ______ {t('teach.date')} ________</div>
  const head = (extra?: string) => (
    <div className="sheet-head"><div><b>{heading}</b>{extra && <> · {extra}</>}</div><div className="muted small">{t('teach.code')}: {seed}</div></div>
  )

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1>🗒 {t('ws.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('ws.intro')}</p>
        <div className="ws-kinds">
          {kinds.map((k) => (
            <button key={k} className={`card ws-kind ${kind === k ? 'on' : ''}`} onClick={() => { setKind(k); setCount(k === 'drill' ? 20 : k === 'mistakes' ? 8 : count) }} aria-pressed={kind === k}>
              <span className="ws-kind-icon" aria-hidden="true">{icons[k]}</span>
              <b>{t(`ws.kinds.${k}`)}</b>
              <span className="muted small">{t(`ws.about.${k}`)}</span>
            </button>
          ))}
        </div>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span className="muted small">{t('teach.workTitle')}</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(`ws.kinds.${kind}`)} />
          </label>
          <div>
            <div className="muted small" style={{ marginBottom: 6 }}>{t('teach.sections')}</div>
            <div className="chips">{secWithGens.map((s) => <button key={s} className={`chip ${secs.includes(s) ? 'on' : ''}`} onClick={() => toggle(s)}>{t(`section.${s}`)}</button>)}</div>
          </div>
          <div className="chips" style={{ alignItems: 'center' }}>
            <span className="muted small">{t('teach.level')}:</span>
            {levels.map((l) => <button key={l} className={`chip ${level === l ? 'on' : ''}`} onClick={() => setLevel(l)}>{t(`level.${l}`)}</button>)}
          </div>
          {kind === 'drill' && (
            <div className="chips" style={{ alignItems: 'center' }}>
              <span className="muted small">{t('ws.count')}:</span>
              {[12, 20, 30, 40].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n}</button>)}
            </div>
          )}
          {kind === 'mistakes' && (
            <div className="chips" style={{ alignItems: 'center' }}>
              <span className="muted small">{t('ws.count')}:</span>
              {[6, 8, 10, 12].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n}</button>)}
            </div>
          )}
          {kind === 'cards' && (
            <div className="chips" style={{ alignItems: 'center' }}>
              <span className="muted small">{t('ws.cardCount')}:</span>
              {[4, 6, 8, 12, 16].map((n) => <button key={n} className={`chip ${cards === n ? 'on' : ''}`} onClick={() => setCards(n)}>{n}</button>)}
            </div>
          )}
          {kind === 'cipher' && (
            <label style={{ display: 'grid', gap: 4 }}>
              <span className="muted small">{t('ws.word')}</span>
              <input className="input" value={word} maxLength={16} onChange={(e) => setWord(e.target.value.replace(/[^\p{L} ]/gu, ''))} placeholder={t('ws.wordPh')} />
            </label>
          )}
          <label className="check-row"><input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} /> {t('ws.withKey')}</label>
          <div className="muted small">{pool.length ? t('teach.pool', { n: pool.length }) : t('ws.noPool')}</div>
          <div className="chips">
            <button className="btn" onClick={() => window.print()} disabled={!ready}>🖨 {t('teach.print')}</button>
            <button className="chip" onClick={() => setSeed(1000 + Math.floor(Math.random() * 9000))}>🎲 {t('teach.newNumbers')}</button>
          </div>
        </div>
        {ready && <div className="muted small">{t('ws.preview')}</div>}
      </div>

      {ready && (
        <div className="print-area ws-area">
          {kind === 'drill' && (
            <section className="sheet">
              {head()}{fields}
              <ol className="ws-drill">
                {drill.map((p, i) => <li key={i}><Statement p={p} lang={lang} /><span className="ws-blank">{t('ws.answerShort')}: ____________</span></li>)}
              </ol>
            </section>
          )}

          {kind === 'cipher' && cipher && (
            <section className="sheet">
              {head()}{fields}
              <p className="ws-rule">{t('ws.cipherRule')}</p>
              <ol className="ws-drill">
                {cipher.tasks.map(({ p }, i) => <li key={i}><Statement p={p} lang={lang} /></li>)}
              </ol>
              <div className="ws-table">
                {cipher.table.map((x, i) => <div key={i} className="ws-cell"><Tex tex={x.answer} /><b>{x.letter}</b></div>)}
              </div>
              <div className="ws-boxes">
                {[...cipher.word].map((c, i) => c === ' ' ? <span key={i} className="ws-gap" /> : (
                  <span key={i} className="ws-box"><span className="ws-box-letter" /><small>{[...cipher.word].slice(0, i).filter((x) => x !== ' ').length + 1}</small></span>
                ))}
              </div>
            </section>
          )}

          {kind === 'mistakes' && (
            <section className="sheet">
              {head()}{fields}
              <p className="ws-rule">{t('ws.mistakesRule')}</p>
              <ol className="ws-mist">
                {mistakes.map((m, i) => (
                  <li key={i}>
                    <Statement p={m.p} lang={lang} />
                    <div className="ws-student">✍ {t('ws.studentAnswer')}: <Tex tex={m.shown} /></div>
                    <div className="ws-mark">□ {t('ws.right')} &nbsp;&nbsp; □ {t('ws.wrong')} &nbsp;&nbsp; {t('ws.correct')}: ______________________</div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {kind === 'cards' && (
            <section className="sheet ws-cards-sheet">
              <div className="ws-cards">
                {cardSets.map((ps, c) => (
                  <div key={c} className="ws-card">
                    <div className="ws-card-head"><b>{heading}</b><span>{t('ws.card')} № {c + 1}</span></div>
                    <div className="ws-card-name">{t('teach.name')} ________________</div>
                    <ol>{ps.map((p, i) => <li key={i}><Statement p={p} lang={lang} /></li>)}</ol>
                  </div>
                ))}
              </div>
            </section>
          )}

          {withKey && (
            <section className="sheet answers">
              {head(t('teach.answers'))}
              {kind === 'drill' && <ol className="ws-key">{drill.map((p, i) => <li key={i}><Tex tex={p.answer} /></li>)}</ol>}
              {kind === 'cipher' && cipher && (
                <>
                  <p className="ws-key-word">{t('ws.keyWord')}: <b>{cipher.word}</b></p>
                  <ol className="ws-key">{cipher.tasks.map(({ p, letter }, i) => <li key={i}><Tex tex={p.answer} /> → <b>{letter}</b></li>)}</ol>
                </>
              )}
              {kind === 'mistakes' && (
                <ol className="answer-list">
                  {mistakes.map((m, i) => (
                    <li key={i}>
                      {m.right ? <>✓ {t('ws.right')}: <Tex tex={m.p.answer} /></> : <>✗ {t('ws.wrong')}. {t('ws.correct')}: <Tex tex={m.p.answer} /> — <span className="muted">{t(`mist.${m.why}`)}</span></>}
                    </li>
                  ))}
                </ol>
              )}
              {kind === 'cards' && (
                <div className="ws-key-cards">
                  {cardSets.map((ps, c) => (
                    <div key={c}><b>№ {c + 1}:</b> {ps.map((p, i) => <span key={i}> {i + 1}) <Tex tex={p.answer} />;</span>)}</div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
