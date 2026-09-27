import { translator, type Locale } from '@/i18n'

export function LoadingState({ locale }: { locale: Locale }) {
  return <div role="status" aria-live="polite" className="portal-empty" lang={locale}>
    <p className="font-medium text-primary">{translator(locale)('page.loading')}</p>
    <div aria-hidden="true" className="mt-5 space-y-3">
      <div className="portal-loading-bar w-3/4" />
      <div className="portal-loading-bar w-full" />
      <div className="portal-loading-bar w-1/2" />
    </div>
  </div>
}
