import type { SignChart as Chart } from '../../lib/calc/tools'
import { Tex } from '../Tex'

/** Number line for the interval method: points, signs and the chosen intervals. */
export function SignChart({ chart }: { chart: Chart }) {
  const n = chart.points.length
  return (
    <div className="signchart" role="img" aria-label="sign chart">
      <div className="sc-line">
        {Array.from({ length: n + 1 }, (_, i) => (
          <div key={`i${i}`} style={{ display: 'contents' }}>
            <div className={`sc-iv ${chart.take[i] ? 'take' : ''}`}>
              <span className={`sc-sign ${chart.signs[i] === '+' ? 'plus' : 'minus'}`}>{chart.signs[i] === '+' ? '+' : '−'}</span>
            </div>
            {i < n && (
              <div className="sc-pt">
                <span className={`sc-dot ${chart.points[i].hollow ? 'hollow' : ''}`} />
                <span className="sc-label"><Tex tex={chart.points[i].tex} /></span>
              </div>
            )}
          </div>
        ))}
        <span className="sc-arrow">x</span>
      </div>
    </div>
  )
}
