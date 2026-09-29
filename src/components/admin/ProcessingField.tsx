'use client'

import { useDocumentInfo, useField } from '@payloadcms/ui'
import type { SelectFieldClientProps } from 'payload'
import { ProcessingState } from './ProcessingState'

export function ProcessingField({ path }: SelectFieldClientProps) {
  const { value } = useField<string>({ path })
  const { id } = useDocumentInfo()
  // An unsaved record only has the default "queued"; nothing is waiting until it is saved.
  return <ProcessingState value={id ? value : null} />
}

export function ProcessingCell({ cellData }: { cellData?: unknown }) {
  return <ProcessingState value={cellData} compact />
}
