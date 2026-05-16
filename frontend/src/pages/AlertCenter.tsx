import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { runAgent } from '@/api/client'
import { Bell, MapPin, Stethoscope } from 'lucide-react'

interface ZooPoint {
  id: string
  name: string
  lat: number
  lng: number
  outbreak_count: number
}

interface VetClinic {
  id: string
  name: string
  lat: number
  lng: number
  trust_score: number
  specialisation: string[]
}

interface HeatmapData {
  zoonotic_locations: ZooPoint[]
  vet_clinics: VetClinic[]
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

export default function AlertCenter() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    runAgent('alert_heatmap', {})
      .then(res => {
        if (res.success) setData(res.data as HeatmapData)
        else setError(res.error ?? 'Failed to load outbreak data')
      })
      .catch(() => setError('Request failed'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || !mapRef.current || !MAPS_API_KEY) return
    const loader = new Loader({ apiKey: MAPS_API_KEY, version: 'weekly', libraries: ['visualization'] })
    loader.load().then(google => {
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 5.5, lng: 105.0 },
        zoom: 5,
        mapTypeId: 'terrain',
        styles: [
          { featureType: 'water', stylers: [{ color: '#0d1f35' }] },
          { featureType: 'landscape', stylers: [{ color: '#0a1520' }] },
          { featureType: 'road', stylers: [{ color: '#1a2a3a' }] },
        ],
      })
      const heatPoints = data.zoonotic_locations.map(z =>
        new google.maps.visualization.WeightedLocation({
          location: new google.maps.LatLng(z.lat, z.lng),
          weight: z.outbreak_count,
        })
      )
      if (heatPoints.length > 0) {
        new google.maps.visualization.HeatmapLayer({
          data: heatPoints, map, radius: 60, opacity: 0.8,
          gradient: ['rgba(0,255,255,0)', 'rgba(0,255,255,1)', 'rgba(0,191,255,1)', 'rgba(0,127,255,1)', 'rgba(255,0,0,1)'],
        })
      }
      const infoWindow = new google.maps.InfoWindow()
      data.vet_clinics.forEach(vet => {
        const marker = new google.maps.Marker({
          position: { lat: vet.lat, lng: vet.lng }, map, title: vet.name,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#00dc82', fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2 },
        })
        marker.addListener('click', () => {
          infoWindow.setContent(
            `<div style="color:#000;font-family:sans-serif;max-width:200px">
              <strong>${vet.name}</strong><br/>Trust score: ${Math.round(vet.trust_score * 100)}%<br/>
              Specialises in: ${(vet.specialisation ?? []).join(', ')}
            </div>`
          )
          infoWindow.open(map, marker)
        })
      })
    })
  }, [data])

  const totalOutbreaks = data?.zoonotic_locations.reduce((sum, z) => sum + z.outbreak_count, 0) ?? 0

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Outbreak Monitoring</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Bell size={22} color="var(--green)" /> Alert Center
        </h2>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Zoonotic outbreak heatmap and vet clinic locations across the region
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Zoonotic Events', value: totalOutbreaks, color: '#f43f5e' },
          { label: 'Affected Locations', value: data?.zoonotic_locations.length ?? 0, color: '#f59e0b' },
          { label: 'Vet Clinics Mapped', value: data?.vet_clinics.length ?? 0, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '0.75rem' }}>{s.label}</p>
            <p style={{ fontSize: '2.2rem', fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Map */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={15} color="var(--green)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Outbreak Heatmap</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} /> Zoonotic risk
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00dc82', display: 'inline-block' }} /> Vet clinic
              </span>
            </div>
          </div>

          {loading && (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
              Loading outbreak data…¦
            </div>
          )}
          {error && (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {!MAPS_API_KEY && !loading && (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
              Set <code style={{ color: 'var(--green)' }}>VITE_GOOGLE_MAPS_API_KEY</code> in frontend/.env to enable the map.
            </div>
          )}
          <div ref={mapRef} style={{ height: 420, display: MAPS_API_KEY && !loading ? 'block' : 'none' }} />
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Outbreak locations */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Bell size={14} color="#f43f5e" />
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outbreak Locations</p>
            </div>
            {!data?.zoonotic_locations.length ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>No zoonotic events recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.zoonotic_locations.map(z => (
                  <div key={z.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem', borderRadius: 8,
                    background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>{z.name}</span>
                    <span className="badge badge-danger">{z.outbreak_count} event{z.outbreak_count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vet clinics */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Stethoscope size={14} color="var(--green)" />
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vet Clinics</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data?.vet_clinics.map(v => (
                <div key={v.id} style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(0,220,130,0.05)', border: '1px solid rgba(0,220,130,0.15)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>{v.name}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                    {(v.specialisation ?? []).map(s => (
                      <span key={s} style={{ padding: '0.15rem 0.45rem', borderRadius: 4, fontSize: '0.7rem', background: 'rgba(6,18,44,0.06)', color: 'var(--text-2)' }}>{s}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--green)' }}>Trust: {Math.round(v.trust_score * 100)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
