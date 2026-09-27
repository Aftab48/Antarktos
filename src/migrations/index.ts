import * as migration_20260927_123059_initial from './20260927_123059_initial';
import * as migration_20260927_123315_r2_storage from './20260927_123315_r2_storage';

export const migrations = [
  {
    up: migration_20260927_123059_initial.up,
    down: migration_20260927_123059_initial.down,
    name: '20260927_123059_initial',
  },
  {
    up: migration_20260927_123315_r2_storage.up,
    down: migration_20260927_123315_r2_storage.down,
    name: '20260927_123315_r2_storage'
  },
];
