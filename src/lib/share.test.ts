import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, DEFAULT_OPTIONS } from './types'
import { decodeShareState, defaultState, encodeShareState } from './share'
import type { AppState } from './share'

describe('share link encoding', () => {
  it('round-trips a modified state exactly', () => {
    const state: AppState = {
      inputs: { ...DEFAULT_INPUTS, homePrice: 1_500_000, monthlyRent: 3_000, horizonYears: 21 },
      options: { ...DEFAULT_OPTIONS, includeEigenmietwert: false },
      canton: 'GE',
    }
    const decoded = decodeShareState(encodeShareState(state))
    expect(decoded).toEqual(state)
  })

  it('round-trips the default state (short payload)', () => {
    const encoded = encodeShareState(defaultState())
    expect(encoded.length).toBeLessThan(60) // diff-encoding keeps untouched state tiny
    expect(decodeShareState(encoded)).toEqual(defaultState())
  })

  it('is URL-safe (base64url alphabet only)', () => {
    const state: AppState = {
      inputs: { ...DEFAULT_INPUTS, homePrice: 3_950_000, mortgageRatePct: 4.85 },
      options: DEFAULT_OPTIONS,
      canton: 'ZH',
    }
    expect(encodeShareState(state)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rejects garbage instead of crashing', () => {
    expect(decodeShareState('not-base64!!!')).toBeNull()
    expect(decodeShareState(btoa('"just a string"'))).toBeNull()
    expect(decodeShareState(btoa('[1,2,3]'))).toBeNull()
  })

  it('sanitizes hostile payloads: NaN, negatives, absurd values, bad canton', () => {
    const hostile = btoa(
      JSON.stringify({
        v: 1,
        i: { homePrice: 1e12, monthlyRent: -500, mortgageRatePct: 'NaN', horizonYears: 9999 },
        o: { includeOpportunityCost: 'yes' },
        c: 'XX',
      }),
    )
    const decoded = decodeShareState(hostile)
    expect(decoded).not.toBeNull()
    expect(decoded!.inputs.homePrice).toBe(20_000_000) // capped
    expect(decoded!.inputs.monthlyRent).toBe(0) // floored
    expect(decoded!.inputs.mortgageRatePct).toBe(DEFAULT_INPUTS.mortgageRatePct) // non-numeric dropped
    expect(decoded!.inputs.horizonYears).toBe(40) // capped
    expect(decoded!.options.includeOpportunityCost).toBe(DEFAULT_OPTIONS.includeOpportunityCost) // non-boolean dropped
    expect(decoded!.canton).toBe('custom') // unknown canton dropped
  })
})
