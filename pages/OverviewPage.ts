import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePriceToCents, type OrderTotals } from '../utils/helpers';

/** Checkout step two: "Checkout: Overview". */
export class OverviewPage extends BasePage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly paymentInfo: Locator;
  readonly shippingInfo: Locator;
  readonly itemTotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('cart-list').getByTestId('inventory-item');
    this.itemNames = this.items.getByTestId('inventory-item-name');
    this.itemPrices = this.items.getByTestId('inventory-item-price');
    this.itemQuantities = this.items.getByTestId('item-quantity');
    this.paymentInfo = page.getByTestId('payment-info-value');
    this.shippingInfo = page.getByTestId('shipping-info-value');
    this.itemTotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(this.title).toHaveText('Checkout: Overview');
  }

  async getNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async getPrices(): Promise<string[]> {
    return this.itemPrices.allInnerTexts();
  }

  async getDisplayedTotals(): Promise<OrderTotals> {
    return {
      itemTotalCents: parsePriceToCents(await this.itemTotalLabel.innerText()),
      taxCents: parsePriceToCents(await this.taxLabel.innerText()),
      totalCents: parsePriceToCents(await this.totalLabel.innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
