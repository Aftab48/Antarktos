import * as migration_20260927_123059_initial from './20260927_123059_initial';
import * as migration_20260927_123315_r2_storage from './20260927_123315_r2_storage';
import * as migration_20260927_130458_localize_media_alt from './20260927_130458_localize_media_alt';
import * as migration_20260927_130755_collections from './20260927_130755_collections';
import * as migration_20260927_131000_archive_chunks from './20260927_131000_archive_chunks';
import * as migration_20260927_150000_chunks_published from './20260927_150000_chunks_published';
import * as migration_20260927_170000_hindi_search from './20260927_170000_hindi_search';
import * as migration_20260928_003000_ask_guard from './20260928_003000_ask_guard';

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
  {
    up: migration_20260927_170000_hindi_search.up,
    down: migration_20260927_170000_hindi_search.down,
    name: '20260927_170000_hindi_search',
  },
  {
    up: migration_20260928_003000_ask_guard.up,
    down: migration_20260928_003000_ask_guard.down,
    name: '20260928_003000_ask_guard',
  },
];
