const STATES = {
  queued: { label: 'Queued', detail: 'Saved and waiting for processing.', tone: 'waiting' },
  processing: { label: 'Processing', detail: 'Processing started. This is the last saved state; refresh the record to check for an update.', tone: 'waiting' },
  ready: { label: 'Ready for review', detail: 'Processing is complete. Review the generated content before publishing.', tone: 'ready' },
  needs_ocr: { label: 'Text layer unavailable', detail: 'No readable text was found. OCR is not available; use a PDF with a text layer.', tone: 'attention' },
  failed: { label: 'Processing failed', detail: 'Review the processing error below before retrying this record.', tone: 'attention' },
} as const

// These are saved pipeline states, never simulated progress or a publishing decision.
export function ProcessingState({ value, compact = false }: { value: unknown; compact?: boolean }) {
  const state = typeof value === 'string' && Object.hasOwn(STATES, value) ? STATES[value as keyof typeof STATES] : null
  return <div className="science-processing" role={compact ? undefined : 'status'}>
    {!compact && <p className="science-field-label">Processing state</p>}
    <span className={`science-status science-status--${state?.tone ?? 'waiting'}`}>{state?.label ?? 'Not recorded'}</span>
    {!compact && <p className="science-muted">{state?.detail ?? 'Save the record to begin the existing processing workflow.'}</p>}
  </div>
}
