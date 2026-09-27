'use client'

import { useField } from '@payloadcms/ui'
import type { SelectFieldClientProps } from 'payload'
import { ProcessingState } from './ProcessingState'

export function ProcessingField({ path }: SelectFieldClientProps) {
  const { value } = useField<string>({ path })
  return <ProcessingState value={value} />
}

export function ProcessingCell({ cellData }: { cellData?: unknown }) {
  return <ProcessingState value={cellData} compact />
}
