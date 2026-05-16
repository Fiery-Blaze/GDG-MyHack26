import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { runAgent } from '@/api/client'

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
  const [mapReady, setMapReady] = useState(false)

  // Fetch heatmap data from backend
  useEffect(() => {
    runAgent('alert_heatmap', {})
      .then(res => {
        if (res.success) setData(res.data as HeatmapData)
        else setError(res.error ?? 'Failed to load outbreak data')
      })
      .catch(() => setError('Request failed'))
      .finally(() => setLoading(false))
  }, [])

  // Initialise Google Maps once data is ready and the div is mounted
  useEffect(() => {
    if (!data || !mapRef.current || !MAPS_API_KEY) return

    const loader = new Loader({
      apiKey: MAPS_API_KEY,
      version: 'weekly',
      libraries: ['visualization'],
    })

    loader.load().then(google => {
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 5.5, lng: 105.0 }, // Southeast Asia
        zoom: 5,
        mapTypeId: 'terrain',
        styles: [
          { featureType: 'water', stylers: [{ color: '#1a3a5c' }] },
          { featureType: 'landscape', stylers: [{ color: '#0d1f2d' }] },
        ],
      })

      // Heatmap layer — each zoo point is weighted by outbreak_count
      const heatPoints = data.zoonotic_locations.map(z =>
        new google.maps.visualization.WeightedLocation({
          location: new google.maps.LatLng(z.lat, z.lng),
          weight: z.outbreak_count,
        })
      )

      if (heatPoints.length > 0) {
        new google.maps.visualization.HeatmapLayer({
          data: heatPoints,
          map,
          radius: 60,
          opacity: 0.8,
          gradient: [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(255, 0, 0, 1)',
            'rgba(255, 0, 0, 1)',
          ],
        })
      }

      // Vet clinic markers
      const infoWindow = new google.maps.InfoWindow()
      data.vet_clinics.forEach(vet => {
        const marker = new google.maps.Marker({
          position: { lat: vet.lat, lng: vet.lng },
          map,
          title: vet.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#22c55e',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        })

        marker.addListener('click', () => {
          infoWindow.setContent(
            `<div style="color:#000;font-family:sans-serif;max-width:200px">
              <strong>${vet.name}</strong><br/>
              Trust score: ${Math.round(vet.trust_score * 100)}%<br/>
              Specialises in: ${(vet.specialisation ?? []).join(', ')}
            </div>`
          )
          infoWindow.open(map, marker)
        })
      })

      setMapReady(true)
    })
  }, [data])

  const totalOutbreaks = data?.zoonotic_locations.reduce(
    (sum, z) => sum + z.outbreak_count, 0
  ) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alert Center</h2>
        <p className="text-muted-foreground">
          Zoonotic outbreak heatmap and vet clinic locations across the region
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Zoonotic Events</p>
            <p className="text-3xl font-bold text-destructive">{totalOutbreaks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Affected Locations</p>
            <p className="text-3xl font-bold">{data?.zoonotic_locations.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vet Clinics Mapped</p>
            <p className="text-3xl font-bold text-green-500">{data?.vet_clinics.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Map */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Outbreak Heatmap
              <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Zoonotic risk
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 ml-2" /> Vet clinic
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Loading outbreak data…
              </div>
            )}
            {error && (
              <div className="h-96 flex items-center justify-center text-destructive text-sm">
                {error}
              </div>
            )}
            {!MAPS_API_KEY && !loading && (
              <div className="h-96 flex items-center justify-center text-muted-foreground text-sm">
                Set VITE_GOOGLE_MAPS_API_KEY in frontend/.env to enable the map.
              </div>
            )}
            <div
              ref={mapRef}
              className="w-full rounded-b-lg"
              style={{ height: '480px', display: MAPS_API_KEY && !loading ? 'block' : 'none' }}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Zoonotic locations */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Outbreak Locations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data?.zoonotic_locations.length === 0 && (
                <p className="text-sm text-muted-foreground">No zoonotic events recorded.</p>
              )}
              {data?.zoonotic_locations.map(z => (
                <div key={z.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <span className="text-sm">{z.name}</span>
                  <Badge variant="destructive">{z.outbreak_count} event{z.outbreak_count !== 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Vet clinics */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Vet Clinics</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data?.vet_clinics.map(v => (
                <div key={v.id} className="border rounded-md px-3 py-2 space-y-1">
                  <p className="text-sm font-medium">{v.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {(v.specialisation ?? []).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trust: {Math.round(v.trust_score * 100)}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
