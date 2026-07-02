import { DEFAULT_INPUTS, DEFAULT_OPTIONS } from './types'
import type { CalculatorInputs, MethodologyOptions } from './types'
import { CUSTOM_CANTON, findCanton } from './cantons'

/** Everything worth persisting / sharing. */
export interface AppState {
  inputs: CalculatorInputs
  options: MethodologyOptions
  canton: string // canton code or CUSTOM_CANTON
}

const STORAGE_KEY = 'rent-or-buy-ch:v1'
export const SHARE_PARAM = 's'

/* Hard caps for values arriving from a URL or storage — generous enough to
   never fight the sliders, tight enough to keep hostile payloads sane. */
const INPUT_CAPS: Record<keyof CalculatorInputs, number> = {
  homePrice: 20_000_000,
  downPaymentPct: 100,
  mortgageRatePct: 15,
  amortizationYears: 30,
  propertyTaxPct: 2,
  maintenancePct: 5,
  homeInsuranceAnnual: 50_000,
  hoaMonthly: 5_000,
  buyClosingCostPct: 10,
  sellClosingCostPct: 10,
  homeAppreciationPct: 15,
  eigenmietwertPct: 10,
  propertyGainsTaxPct: 60,
  monthlyRent: 50_000,
  rentGrowthPct: 10,
  rentersInsuranceMonthly: 500,
  investmentReturnPct: 15,
  inflationPct: 10,
  marginalTaxRatePct: 60,
  horizonYears: 40,
}

export function defaultState(): AppState {
  return { inputs: DEFAULT_INPUTS, options: DEFAULT_OPTIONS, canton: CUSTOM_CANTON }
}

/** Merge an untrusted payload over the defaults, dropping anything invalid. */
function sanitize(raw: unknown): AppState | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const src = raw as { i?: unknown; o?: unknown; c?: unknown }
  const rawInputs = (typeof src.i === 'object' && src.i !== null ? src.i : {}) as Record<string, unknown>
  const rawOptions = (typeof src.o === 'object' && src.o !== null ? src.o : {}) as Record<string, unknown>

  const inputs = { ...DEFAULT_INPUTS }
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof CalculatorInputs)[]) {
    const value = Number(rawInputs[key])
    if (Number.isFinite(value)) inputs[key] = Math.min(Math.max(value, 0), INPUT_CAPS[key])
  }

  const options = { ...DEFAULT_OPTIONS }
  for (const key of Object.keys(DEFAULT_OPTIONS) as (keyof MethodologyOptions)[]) {
    const value = rawOptions[key]
    if (typeof value === 'boolean') options[key] = value
  }

  const canton =
    typeof src.c === 'string' && (src.c === CUSTOM_CANTON || findCanton(src.c)) ? src.c : CUSTOM_CANTON

  return { inputs, options, canton }
}

/* ---------- share links ---------- */

/** Diff against the defaults so untouched settings don't bloat the URL. */
function toPayload(state: AppState) {
  const i: Partial<Record<keyof CalculatorInputs, number>> = {}
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof CalculatorInputs)[]) {
    if (state.inputs[key] !== DEFAULT_INPUTS[key]) i[key] = state.inputs[key]
  }
  const o: Partial<Record<keyof MethodologyOptions, boolean>> = {}
  for (const key of Object.keys(DEFAULT_OPTIONS) as (keyof MethodologyOptions)[]) {
    if (state.options[key] !== DEFAULT_OPTIONS[key]) o[key] = state.options[key]
  }
  return { v: 1, i, o, c: state.canton }
}

export function encodeShareState(state: AppState): string {
  const json = JSON.stringify(toPayload(state)) // ASCII-only keys & values — btoa-safe
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShareState(encoded: string): AppState | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    return sanitize(JSON.parse(atob(base64)))
  } catch {
    return null
  }
}

export function buildShareUrl(state: AppState): string {
  return `${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${encodeShareState(state)}`
}

/* ---------- localStorage ---------- */

export function loadStoredState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null // private mode / disabled storage
  }
}

export function saveStoredState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPayload(state)))
  } catch {
    /* storage unavailable — persistence is best-effort */
  }
}

export function clearStoredState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/* ---------- boot ---------- */

/**
 * Initial state resolution: a share link in the hash wins, then localStorage,
 * then defaults. A consumed hash is removed from the URL so it can't go stale
 * against later edits (which persist to localStorage).
 */
export function loadInitialState(): AppState {
  const match = window.location.hash.match(new RegExp(`[#&]${SHARE_PARAM}=([A-Za-z0-9_-]+)`))
  if (match) {
    const shared = decodeShareState(match[1])
    if (shared) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      saveStoredState(shared)
      return shared
    }
  }
  return loadStoredState() ?? defaultState()
}
