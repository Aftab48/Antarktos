import type { Payload } from 'payload'

import { STORAGE_BUDGET_BYTES, storageUsedBytes } from '../storage'

const gb = (bytes: number) => (bytes / 1e9).toFixed(2)

// Admin dashboard card: R2 storage used vs the 8 GB budget (plan §6.3). Styled with Payload's own CSS variables.
export async function StorageBudget({ payload }: { payload: Payload }) {
  const used = await storageUsedBytes(payload)
  const pct = Math.min(100, (used / STORAGE_BUDGET_BYTES) * 100)
  return (
    <section
      className="science-panel science-storage"
      aria-labelledby="storage-budget-heading"
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        padding: 'var(--base)',
        marginBottom: 'calc(var(--base) * 1.5)',
      }}
    >
      <h2 id="storage-budget-heading" style={{ margin: 0, fontSize: '1rem' }}>
        File storage (Cloudflare R2)
      </h2>
      <p style={{ margin: 'calc(var(--base) / 2) 0' }}>
        {gb(used)} GB of {gb(STORAGE_BUDGET_BYTES)} GB budget used ({pct.toFixed(1)}%). Uploads that would pass the
        budget are refused.
      </p>
      <meter
        min={0}
        max={STORAGE_BUDGET_BYTES}
        low={STORAGE_BUDGET_BYTES * 0.75}
        high={STORAGE_BUDGET_BYTES * 0.9}
        optimum={0}
        value={used}
        aria-label="Storage used"
        style={{ width: '100%' }}
      />
    </section>
  )
}
