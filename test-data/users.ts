export type UserKey = 'standard' | 'lockedOut' | 'problem' | 'performanceGlitch';

export interface UserCredentials {
  username: string;
  password: string;
  description: string;
}

// SauceDemo publishes these demo credentials on its login page. The password can be
// overridden via SAUCE_PASSWORD so no real secret ever needs to live in source control.
const DEFAULT_PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const users: Record<UserKey, UserCredentials> = {
  standard: {
    username: 'standard_user',
    password: DEFAULT_PASSWORD,
    description: 'Standard functional testing',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: DEFAULT_PASSWORD,
    description: 'Negative authentication testing',
  },
  problem: {
    username: 'problem_user',
    password: DEFAULT_PASSWORD,
    description: 'UI and functional anomaly testing',
  },
  performanceGlitch: {
    username: 'performance_glitch_user',
    password: DEFAULT_PASSWORD,
    description: 'Performance-related testing',
  },
};

export const invalidCredentials = {
  username: 'invalid_user',
  password: 'wrong_password',
} as const;

export const loginErrors = {
  invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  unauthenticated: (path: string) => `Epic sadface: You can only access '${path}' when you are logged in.`,
} as const;
