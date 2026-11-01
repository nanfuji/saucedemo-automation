import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutCompletePage extends BasePage {
  readonly title: Locator;
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly confirmationImage: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.confirmationImage = page.getByTestId('pony-express');
    this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(this.title).toHaveText('Checkout: Complete!');
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
