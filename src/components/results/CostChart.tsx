import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ReferenceLine,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import type { CostChartProps } from '../../lib/types'
import { formatMoney, formatMoneyCompact } from '../../lib/format'
import './CostChart.css'

/* The ONE allowed hardcode: SVG <defs> gradients can't reliably read CSS
   custom properties, so these literals intentionally match --rent / --buy. */
const RENT_HEX = '#ff8a63'
const BUY_HEX = '#2bbd8c'

/* Minimal hand-rolled tooltip props — robust across recharts versions. */
interface CostTooltipProps {
  active?: boolean
  label?: number | string
  payload?: ReadonlyArray<{ dataKey?: string | number; value?: number | string }>
}

function toNumber(value: number | string | undefined): number {
  return typeof value === 'number' ? value : Number(value ?? 0)
}

function CostTooltip({ active, payload, label }: CostTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const rent = toNumber(payload.find((p) => p.dataKey === 'rentCumulativeCost')?.value)
  const buy = toNumber(payload.find((p) => p.dataKey === 'buyCumulativeCost')?.value)
  const diff = rent - buy // positive => buying is cheaper so far
  return (
    <div className="cc-tip">
      <div className="cc-tip-title">Year {label}</div>
      <div className="cc-tip-row">
        <span className="cc-tip-dot cc-tip-dot-rent" />
        Rent {formatMoney(rent)}
      </div>
      <div className="cc-tip-row">
        <span className="cc-tip-dot cc-tip-dot-buy" />
        Buy {formatMoney(buy)}
      </div>
      {Math.round(Math.abs(diff)) > 0 ? (
        <div className={`cc-tip-delta ${diff > 0 ? 'cc-tip-delta-buy' : 'cc-tip-delta-rent'}`}>
          {diff > 0 ? 'buy' : 'rent'} ahead by {formatMoney(Math.abs(diff))}
        </div>
      ) : (
        <div className="cc-tip-delta">dead even</div>
      )}
    </div>
  )
}

export function CostChart({ result }: CostChartProps) {
  const { yearly, breakevenYear } = result
  const breakevenPoint =
    breakevenYear !== null ? yearly.find((y) => y.year === breakevenYear) : undefined
  const hasNegative = yearly.some(
    (y) => y.rentCumulativeCost < 0 || y.buyCumulativeCost < 0,
  )

  return (
    <motion.div
      className="cc-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <h3 className="cc-title">The race over time 📈</h3>
      <p className="cc-caption">Net cost of each path if you sold / walked away in that year</p>

      <div className="cc-chart">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={[...yearly]} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cc-rent-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={RENT_HEX} stopOpacity={0.35} />
                <stop offset="100%" stopColor={RENT_HEX} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cc-buy-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BUY_HEX} stopOpacity={0.35} />
                <stop offset="100%" stopColor={BUY_HEX} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(179, 157, 242, 0.25)" vertical={false} />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tickMargin={8} />
            <YAxis
              tickFormatter={formatMoneyCompact}
              axisLine={false}
              tickLine={false}
              width={78}
            />
            <Tooltip
              content={<CostTooltip />}
              cursor={{ stroke: 'rgba(179, 157, 242, 0.4)', strokeDasharray: '4 4' }}
            />
            {hasNegative && (
              <ReferenceLine
                y={0}
                stroke="var(--ink-faint)"
                strokeWidth={1.5}
                opacity={0.7}
                label={{
                  value: 'CHF 0',
                  position: 'insideBottomLeft',
                  fill: 'var(--ink-faint)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="rentCumulativeCost"
              stroke={RENT_HEX}
              strokeWidth={3}
              fill="url(#cc-rent-fill)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
            />
            <Area
              type="monotone"
              dataKey="buyCumulativeCost"
              stroke={BUY_HEX}
              strokeWidth={3}
              fill="url(#cc-buy-fill)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
            />
            {breakevenYear !== null && (
              <ReferenceLine x={breakevenYear} stroke={BUY_HEX} strokeDasharray="4 4" opacity={0.5} />
            )}
            {breakevenPoint && (
              <ReferenceDot
                x={breakevenPoint.year}
                y={breakevenPoint.buyCumulativeCost}
                r={7}
                fill={BUY_HEX}
                stroke="white"
                strokeWidth={3}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <AnimatePresence>
        {hasNegative && (
          <motion.p
            className="cc-zero-note"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            💡 A line below CHF 0 means that path leaves you <em>richer</em> than
            all the cash you ever put in — invested savings compounding past the
            bills. Not a bug, just exponential growth.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
