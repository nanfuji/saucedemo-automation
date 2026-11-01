import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { CustomerInfo } from '../test-data/checkout';

/** Checkout step one: "Checkout: Your Information". */
export class CheckoutPage extends BasePage {
  readonly title: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly errorDismissButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.errorMessage = page.getByTestId('error');
    this.errorDismissButton = page.getByTestId('error-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-one.html');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(this.title).toHaveText('Checkout: Your Information');
  }

  async fillInformation(info: CustomerInfo): Promise<void> {
    // fill('') still clears a field, so empty values intentionally leave it blank.
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  async submitInformation(info: CustomerInfo): Promise<void> {
    await this.fillInformation(info);
    await this.continueButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }
}
