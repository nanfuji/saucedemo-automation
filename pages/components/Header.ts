import { expect, type Locator, type Page } from '@playwright/test';

/** Primary header shared by every authenticated page: logo, burger menu and cart. */
export class Header {
  readonly logo: Locator;
  readonly menuButton: Locator;
  readonly closeMenuButton: Locator;
  readonly menuPanel: Locator;
  readonly allItemsLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly pageTitle: Locator;

  constructor(private readonly page: Page) {
    this.logo = page.locator('.app_logo');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
    this.menuPanel = page.locator('.bm-menu-wrap');
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.aboutLink = page.getByTestId('about-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.pageTitle = page.getByTestId('title');
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await expect(this.menuPanel).toHaveAttribute('aria-hidden', 'false');
    await expect(this.logoutLink).toBeVisible();
  }

  async closeMenu(): Promise<void> {
    await this.closeMenuButton.click();
    await expect(this.menuPanel).toHaveAttribute('aria-hidden', 'true');
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetAppStateLink.click();
    await this.closeMenu();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/\/cart\.html$/);
  }

  /** Expects the badge to show `count`, or to be absent when the cart is empty. */
  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toHaveCount(0);
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
