import { translator, type Locale } from '@/i18n'

export function LoadingState({ locale }: { locale: Locale }) {
  return <div role="status" aria-live="polite" className="max-w-[40rem] pt-14" lang={locale}>
    <p className="font-medium text-night">{translator(locale)('page.loading')}</p>
    <div aria-hidden="true" className="mt-6 space-y-3">
      <div className="portal-loading-bar w-3/4" />
      <div className="portal-loading-bar w-full" />
      <div className="portal-loading-bar w-1/2" />
    </div>
  </div>
}
