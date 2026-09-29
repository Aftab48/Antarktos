'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { translator, type Locale } from '@/i18n'
import type { StationPoint } from '../../_lib/station-map'
import { btnSecondary } from '../../_lib/classes'

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
        attribution: '&copy; <a lang="en" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        maxZoom: 19,
      }).on('tileerror', () => { if (!disposed) setTileError(true) }).addTo(instance)
      // View first: Leaflet builds a marker's element only once the map has a view, and the loop below labels it.
      instance.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [36, 36], maxZoom: 4 })
      for (const point of points) {
        const link = document.createElement('a')
        link.href = point.url
        link.textContent = point.name
        link.lang = point.lang
        link.className = 'underline underline-offset-4'
        // Historical stations: a smaller outlined ring (as in the station list), drawn behind and raised on a stem whose
        // foot is the exact spot, so Dakshin Gangotri stays visible and clickable beside Maitri (70 km apart, a few pixels
        // at the default zoom). Stem: from the ring's padding box (16px ring, 3px border: 13px down) to the anchor at 36px.
        const icon = point.historical
          ? L.divIcon({ className: 'station-map-pin bg-snow border-signal', html: '<span aria-hidden="true" class="absolute top-full left-1/2 h-[23px] w-0.5 -translate-x-1/2 bg-signal"></span>', iconSize: [16, 16], iconAnchor: [8, 36], popupAnchor: [0, -36] })
          : L.divIcon({ className: 'station-map-pin', html: '<span aria-hidden="true"></span>', iconSize: [24, 24], iconAnchor: [12, 12] })
        const marker = L.marker([point.lat, point.lng], { title: point.name, keyboard: true, icon, zIndexOffset: point.historical ? -1000 : 0 })
          .addTo(instance).bindPopup(link, { closeButton: false })
        const element = marker.getElement()
        if (element) { element.lang = point.lang; element.setAttribute('aria-label', point.name) }
      }
      setState('ready')
    }).catch(() => { if (!disposed) setState('error') })
    return () => { disposed = true; map.current?.remove(); map.current = null }
  }, [points])

  if (!points.length) return <div className="portal-empty"><p>{t('stations.mapEmpty')}</p><a href="#station-list" className="mt-2 inline-flex min-h-11 items-center font-medium underline">{t('stations.viewList')}</a></div>
  return <section aria-labelledby="station-map-title" className="overflow-hidden rounded-xl border border-rule bg-snow">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
      <h2 id="station-map-title" className="text-[1.3125rem] font-semibold leading-snug">{t('stations.mapTitle')}</h2>
      <div className="flex gap-2">
        <button type="button" className={btnSecondary} disabled={state !== 'ready'} onClick={() => map.current?.zoomIn()}>{t('stations.zoomIn')}</button>
        <button type="button" className={btnSecondary} disabled={state !== 'ready'} onClick={() => map.current?.zoomOut()}>{t('stations.zoomOut')}</button>
      </div>
    </div>
    <p id="station-map-help" className="px-4 pb-4 text-sm text-slate sm:px-6">{t('stations.mapHelp')} <a href="#station-list" className="text-night underline">{t('stations.viewList')}</a></p>
    {state !== 'ready' && <p role="status" className="px-4 pb-4 sm:px-6">{t(state === 'loading' ? 'stations.mapLoading' : 'stations.mapError')}</p>}
    {tileError && <p role="status" className="px-4 pb-4 sm:px-6">{t('stations.mapError')}</p>}
    <div ref={container} aria-label={t('stations.mapTitle')} aria-describedby="station-map-help" className="station-map relative z-0 h-[24rem] bg-ice sm:h-[30rem]" />
  </section>
}
