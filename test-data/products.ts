export interface Product {
  id: number;
  name: string;
  /** Display price as shown on the site, e.g. "$29.99". */
  price: string;
  /** Leading fragment of the product description (full text is long and contains quirks). */
  descriptionStartsWith: string;
  /** Fragment of the image asset filename (assets are content-hashed). */
  imageFragment: string;
}

export const products = {
  backpack: {
    id: 4,
    name: 'Sauce Labs Backpack',
    price: '$29.99',
    descriptionStartsWith: 'carry.allTheThings() with the sleek, streamlined Sly Pack',
    imageFragment: 'sauce-backpack',
  },
  bikeLight: {
    id: 0,
    name: 'Sauce Labs Bike Light',
    price: '$9.99',
    descriptionStartsWith: "A red light isn't the desired state in testing",
    imageFragment: 'bike-light',
  },
  boltTShirt: {
    id: 1,
    name: 'Sauce Labs Bolt T-Shirt',
    price: '$15.99',
    descriptionStartsWith: 'Get your testing superhero on with the Sauce Labs bolt T-shirt',
    imageFragment: 'bolt-shirt',
  },
  fleeceJacket: {
    id: 5,
    name: 'Sauce Labs Fleece Jacket',
    price: '$49.99',
    descriptionStartsWith: "It's not every day that you come across a midweight quarter-zip fleece jacket",
    imageFragment: 'sauce-pullover',
  },
  onesie: {
    id: 2,
    name: 'Sauce Labs Onesie',
    price: '$7.99',
    descriptionStartsWith: 'Rib snap infant onesie for the junior automation engineer',
    imageFragment: 'red-onesie',
  },
  redTShirt: {
    id: 3,
    name: 'Test.allTheThings() T-Shirt (Red)',
    price: '$15.99',
    descriptionStartsWith: 'This classic Sauce Labs t-shirt is perfect to wear when cozying up',
    imageFragment: 'red-tatt',
  },
} as const satisfies Record<string, Product>;

export type ProductKey = keyof typeof products;

export const allProducts: Product[] = Object.values(products);

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export interface SortScenario {
  id: string;
  option: SortOption;
  label: string;
  field: 'name' | 'price';
  direction: 'asc' | 'desc';
}

export const sortScenarios: SortScenario[] = [
  { id: 'INV-007', option: 'az', label: 'Name (A to Z)', field: 'name', direction: 'asc' },
  { id: 'INV-008', option: 'za', label: 'Name (Z to A)', field: 'name', direction: 'desc' },
  { id: 'INV-009', option: 'lohi', label: 'Price (low to high)', field: 'price', direction: 'asc' },
  { id: 'INV-010', option: 'hilo', label: 'Price (high to low)', field: 'price', direction: 'desc' },
];
