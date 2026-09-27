import * as migration_20260927_123059_initial from './20260927_123059_initial';
import * as migration_20260927_123315_r2_storage from './20260927_123315_r2_storage';
import * as migration_20260927_130458_localize_media_alt from './20260927_130458_localize_media_alt';
import * as migration_20260927_130755_collections from './20260927_130755_collections';
import * as migration_20260927_131000_archive_chunks from './20260927_131000_archive_chunks';
import * as migration_20260927_150000_chunks_published from './20260927_150000_chunks_published';

export const migrations = [
  {
    up: migration_20260927_123059_initial.up,
    down: migration_20260927_123059_initial.down,
    name: '20260927_123059_initial',
  },
  {
    up: migration_20260927_123315_r2_storage.up,
    down: migration_20260927_123315_r2_storage.down,
    name: '20260927_123315_r2_storage',
  },
  {
    up: migration_20260927_130458_localize_media_alt.up,
    down: migration_20260927_130458_localize_media_alt.down,
    name: '20260927_130458_localize_media_alt',
  },
  {
    up: migration_20260927_130755_collections.up,
    down: migration_20260927_130755_collections.down,
    name: '20260927_130755_collections',
  },
  {
    up: migration_20260927_131000_archive_chunks.up,
    down: migration_20260927_131000_archive_chunks.down,
    name: '20260927_131000_archive_chunks',
  },
  {
    up: migration_20260927_150000_chunks_published.up,
    down: migration_20260927_150000_chunks_published.down,
    name: '20260927_150000_chunks_published',
  },
];
