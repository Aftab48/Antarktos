'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { translator, type Locale } from '@/i18n'
import type { StationPoint } from '../../_lib/station-map'

export function StationMap({ points, l }: { points: StationPoint[]; l: Locale }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tileError, setTileError] = useState(false)
  const t = translator(l)
  useEffect(() => {
    let disposed = false
    if (!points.length) return
    import('leaflet').then((L) => {
      if (disposed || !container.current) return
      const instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: false, minZoom: 1, maxZoom: 12 })
      map.current = instance
      instance.attributionControl.setPrefix(false)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a lang="en" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).on('tileerror', () => { if (!disposed) setTileError(true) }).addTo(instance)
      for (const point of points) {
        const link = document.createElement('a')
        link.href = point.url
        link.textContent = point.name
        link.lang = point.lang
        link.className = 'underline underline-offset-4'
        const marker = L.marker([point.lat, point.lng], {
          title: point.name, alt: point.name, keyboard: true,
          icon: L.divIcon({ className: 'station-map-pin', html: '<span aria-hidden="true"></span>', iconSize: [24, 24], iconAnchor: [12, 12] }),
        }).addTo(instance).bindPopup(link, { closeButton: false })
        const element = marker.getElement()
        if (element) { element.lang = point.lang; element.setAttribute('aria-label', point.name) }
      }
      instance.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [36, 36], maxZoom: 4 })
      setState('ready')
    }).catch(() => { if (!disposed) setState('error') })
    return () => { disposed = true; map.current?.remove(); map.current = null }
  }, [points])

  if (!points.length) return <p className="mt-6 rounded-xl border p-5">{t('stations.mapEmpty')}</p>
  return <section aria-labelledby="station-map-title" className="mt-8 overflow-hidden rounded-xl border bg-card">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <h2 id="station-map-title" className="text-lg font-semibold">{t('stations.mapTitle')}</h2>
      <div className="flex gap-2">
        <button className="rounded-md border bg-background px-3 py-2 text-sm" disabled={state !== 'ready'} onClick={() => map.current?.zoomIn()}>{t('stations.zoomIn')}</button>
        <button className="rounded-md border bg-background px-3 py-2 text-sm" disabled={state !== 'ready'} onClick={() => map.current?.zoomOut()}>{t('stations.zoomOut')}</button>
      </div>
    </div>
    <p id="station-map-help" className="px-4 pb-4 text-sm text-muted-foreground">{t('stations.mapHelp')} <a href="#station-list" className="underline underline-offset-4">{t('stations.viewList')}</a></p>
    {state !== 'ready' && <p role="status" className="px-4 pb-4">{t(state === 'loading' ? 'stations.mapLoading' : 'stations.mapError')}</p>}
    {tileError && <p role="status" className="px-4 pb-4">{t('stations.mapError')}</p>}
    <div ref={container} aria-label={t('stations.mapTitle')} aria-describedby="station-map-help" className="station-map relative z-0 h-[28rem] bg-muted" />
  </section>
}
