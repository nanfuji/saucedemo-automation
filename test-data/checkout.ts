export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const validCustomer: CustomerInfo = {
  firstName: 'Jane',
  lastName: 'Tester',
  postalCode: '90210',
};

export const checkoutErrors = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;

export interface CheckoutValidationScenario {
  id: string;
  title: string;
  info: CustomerInfo;
  expectedError: string;
}

export const checkoutValidationScenarios: CheckoutValidationScenario[] = [
  {
    id: 'CHK-003',
    title: 'empty first name',
    info: { ...validCustomer, firstName: '' },
    expectedError: checkoutErrors.firstNameRequired,
  },
  {
    id: 'CHK-004',
    title: 'empty last name',
    info: { ...validCustomer, lastName: '' },
    expectedError: checkoutErrors.lastNameRequired,
  },
  {
    id: 'CHK-005',
    title: 'empty postal code',
    info: { ...validCustomer, postalCode: '' },
    expectedError: checkoutErrors.postalCodeRequired,
  },
  {
    id: 'CHK-006',
    title: 'all fields empty',
    info: { firstName: '', lastName: '', postalCode: '' },
    expectedError: checkoutErrors.firstNameRequired,
  },
];

export interface UnusualInputScenario {
  id: string;
  title: string;
  info: CustomerInfo;
}

export const unusualInputScenarios: UnusualInputScenario[] = [
  {
    id: 'CHK-007',
    title: 'special characters',
    info: { firstName: "J@ne-Ann!#$%", lastName: "O'Brien-Smith&*()", postalCode: 'SW1A 1AA' },
  },
  {
    id: 'CHK-008',
    title: 'numeric characters in name fields',
    info: { firstName: '12345', lastName: '67890', postalCode: '10001' },
  },
];

export const injectionPayloads: CustomerInfo = {
  firstName: '<img src=x onerror=alert("xss")>',
  lastName: '<script>alert("xss")</script>',
  postalCode: '"><svg onload=alert(1)>',
};

export const completeMessages = {
  header: 'Thank you for your order!',
  text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
} as const;
