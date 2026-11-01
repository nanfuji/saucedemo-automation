import type { SortScenario } from '../test-data/products';

/** Sales tax rate applied by SauceDemo on the checkout overview. */
export const TAX_RATE_PERCENT = 8;

export interface OrderTotals {
  itemTotalCents: number;
  taxCents: number;
  totalCents: number;
}

/**
 * Parses a currency string such as "$29.99", "Item total: $55.97" or "Tax: $4.48"
 * into integer cents so that all arithmetic is exact (no floating point drift).
 */
export function parsePriceToCents(text: string): number {
  const match = text.match(/\$?\s*(\d+)(?:\.(\d{1,2}))?/);
  if (!match) {
    throw new Error(`Unable to parse a price from "${text}"`);
  }
  const dollars = Number(match[1]);
  const cents = Number((match[2] ?? '0').padEnd(2, '0'));
  return dollars * 100 + cents;
}

export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = (cents % 100).toString().padStart(2, '0');
  return `$${dollars}.${remainder}`;
}

/** Tax rounded half-up to the nearest cent using integer arithmetic. */
export function calculateTaxCents(itemTotalCents: number, ratePercent = TAX_RATE_PERCENT): number {
  return Math.round((itemTotalCents * ratePercent) / 100);
}

export function calculateOrderTotals(prices: string[], ratePercent = TAX_RATE_PERCENT): OrderTotals {
  const itemTotalCents = prices.map(parsePriceToCents).reduce((sum, cents) => sum + cents, 0);
  const taxCents = calculateTaxCents(itemTotalCents, ratePercent);
  return { itemTotalCents, taxCents, totalCents: itemTotalCents + taxCents };
}

export interface NamedPrice {
  name: string;
  price: string;
}

/** Independently computes the expected product name order for a sort scenario. */
export function expectedSortedNames(items: NamedPrice[], scenario: Pick<SortScenario, 'field' | 'direction'>): string[] {
  const sorted = [...items].sort((a, b) => {
    const comparison =
      scenario.field === 'name'
        ? a.name.localeCompare(b.name, 'en')
        : parsePriceToCents(a.price) - parsePriceToCents(b.price);
    if (comparison !== 0) {
      return scenario.direction === 'asc' ? comparison : -comparison;
    }
    // Equal prices keep alphabetical order, matching SauceDemo's stable sort.
    return a.name.localeCompare(b.name, 'en');
  });
  return sorted.map((item) => item.name);
}

export function isSorted<T>(values: T[], compare: (a: T, b: T) => number): boolean {
  return values.every((value, index) => index === 0 || compare(values[index - 1], value) <= 0);
}

/** Converts a product name into the slug SauceDemo uses in data-test ids. */
export function toProductSlug(productName: string): string {
  return productName.toLowerCase().replace(/\s+/g, '-');
}

export interface KnownDefect {
  user: string;
  summary: string;
}

/**
 * Records an intentional SauceDemo application defect on the current test so it is
 * reported separately from automation failures (visible in the HTML report annotations).
 */
export function annotateKnownDefect(annotations: { type: string; description?: string }[], defect: KnownDefect): void {
  annotations.push({ type: 'known-defect', description: `[${defect.user}] ${defect.summary}` });
}
