import type { CalculatorInputs } from './types'

/**
 * Canton presets for the property-related inputs. Values are deliberately
 * rough, rounded estimates (mid-2026):
 *  - buyClosingCostPct: transfer tax + notary + land registry, as % of price.
 *    Near-zero in ZH/ZG/AG (no transfer tax), ~4–5% in the Romandie.
 *  - propertyTaxPct: cantonal/communal Liegenschaftssteuer (0 where abolished).
 *  - propertyGainsTaxPct: effective Grundstückgewinnsteuer for a ~10-year
 *    hold — real rates are progressive and fall with holding period.
 * Communes vary; the UI labels these as estimates.
 */
export interface Canton {
  code: string
  name: string
  buyClosingCostPct: number
  propertyTaxPct: number
  propertyGainsTaxPct: number
}

export const CUSTOM_CANTON = 'custom'

/** The inputs a canton preset drives — editing one of these flips the selector to Custom. */
export const CANTON_DRIVEN_KEYS = [
  'buyClosingCostPct',
  'propertyTaxPct',
  'propertyGainsTaxPct',
] as const satisfies readonly (keyof CalculatorInputs)[]

export const CANTONS: Canton[] = [
  { code: 'AG', name: 'Aargau', buyClosingCostPct: 0.6, propertyTaxPct: 0, propertyGainsTaxPct: 16 },
  { code: 'AI', name: 'Appenzell Innerrhoden', buyClosingCostPct: 1.0, propertyTaxPct: 0, propertyGainsTaxPct: 13 },
  { code: 'AR', name: 'Appenzell Ausserrhoden', buyClosingCostPct: 1.5, propertyTaxPct: 0, propertyGainsTaxPct: 15 },
  { code: 'BE', name: 'Bern', buyClosingCostPct: 2.6, propertyTaxPct: 0.15, propertyGainsTaxPct: 20 },
  { code: 'BL', name: 'Basel-Landschaft', buyClosingCostPct: 3.0, propertyTaxPct: 0.1, propertyGainsTaxPct: 17 },
  { code: 'BS', name: 'Basel-Stadt', buyClosingCostPct: 4.0, propertyTaxPct: 0.1, propertyGainsTaxPct: 21 },
  { code: 'FR', name: 'Fribourg', buyClosingCostPct: 4.3, propertyTaxPct: 0.15, propertyGainsTaxPct: 16 },
  { code: 'GE', name: 'Genève', buyClosingCostPct: 4.5, propertyTaxPct: 0.1, propertyGainsTaxPct: 10 },
  { code: 'GL', name: 'Glarus', buyClosingCostPct: 0.8, propertyTaxPct: 0, propertyGainsTaxPct: 15 },
  { code: 'GR', name: 'Graubünden', buyClosingCostPct: 2.5, propertyTaxPct: 0.1, propertyGainsTaxPct: 15 },
  { code: 'JU', name: 'Jura', buyClosingCostPct: 4.0, propertyTaxPct: 0.1, propertyGainsTaxPct: 15 },
  { code: 'LU', name: 'Luzern', buyClosingCostPct: 2.0, propertyTaxPct: 0, propertyGainsTaxPct: 17 },
  { code: 'NE', name: 'Neuchâtel', buyClosingCostPct: 4.4, propertyTaxPct: 0.15, propertyGainsTaxPct: 18 },
  { code: 'NW', name: 'Nidwalden', buyClosingCostPct: 0.5, propertyTaxPct: 0, propertyGainsTaxPct: 12 },
  { code: 'OW', name: 'Obwalden', buyClosingCostPct: 0.6, propertyTaxPct: 0, propertyGainsTaxPct: 12 },
  { code: 'SG', name: 'St. Gallen', buyClosingCostPct: 1.5, propertyTaxPct: 0, propertyGainsTaxPct: 17 },
  { code: 'SH', name: 'Schaffhausen', buyClosingCostPct: 1.6, propertyTaxPct: 0.05, propertyGainsTaxPct: 15 },
  { code: 'SO', name: 'Solothurn', buyClosingCostPct: 2.7, propertyTaxPct: 0.1, propertyGainsTaxPct: 17 },
  { code: 'SZ', name: 'Schwyz', buyClosingCostPct: 0.5, propertyTaxPct: 0, propertyGainsTaxPct: 12 },
  { code: 'TG', name: 'Thurgau', buyClosingCostPct: 1.5, propertyTaxPct: 0.05, propertyGainsTaxPct: 15 },
  { code: 'TI', name: 'Ticino', buyClosingCostPct: 2.2, propertyTaxPct: 0.2, propertyGainsTaxPct: 15 },
  { code: 'UR', name: 'Uri', buyClosingCostPct: 0.6, propertyTaxPct: 0, propertyGainsTaxPct: 13 },
  { code: 'VD', name: 'Vaud', buyClosingCostPct: 4.5, propertyTaxPct: 0.1, propertyGainsTaxPct: 12 },
  { code: 'VS', name: 'Valais', buyClosingCostPct: 2.6, propertyTaxPct: 0.1, propertyGainsTaxPct: 12 },
  { code: 'ZG', name: 'Zug', buyClosingCostPct: 0.4, propertyTaxPct: 0, propertyGainsTaxPct: 10 },
  { code: 'ZH', name: 'Zürich', buyClosingCostPct: 0.3, propertyTaxPct: 0, propertyGainsTaxPct: 22 },
]

export function findCanton(code: string): Canton | undefined {
  return CANTONS.find((c) => c.code === code)
}
