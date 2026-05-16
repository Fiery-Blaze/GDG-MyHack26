import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { runAgent } from '@/api/client'

interface Match {
  id: string
  name: string
  reason: string
}

export default function TransferMatching() {
  const [form, setForm] = useState({ species: '', sex: '', age: '', from_zoo_id: '' })
  const [matches, setMatches] = useState<Match[]>([])
  const [sla, setSla] = useState<{ delay_probability: number; high_risk: boolean; risk_factors: string[]; mitigations?: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  async function findMatches() {
    setLoading(true)
    try {
      const [matchRes, slaRes] = await Promise.all([
        runAgent('match_transfer', { ...form, age: Number(form.age) }),
        runAgent('sla_predict', { distance_km: 3000, cites_level: 2, num_permits: 2, quarantine_days: 7, past_delays_on_route: 1 }),
      ])
      setMatches(matchRes.data?.matches ?? [])
      setSla(slaRes.data)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = sla ? (sla.delay_probability > 0.6 ? 'destructive' : sla.delay_probability > 0.3 ? 'secondary' : 'secondary') : 'secondary'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transfer Matching</h2>
        <p className="text-muted-foreground">Find the best zoo matches for an animal transfer</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Animal Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Species</Label>
            <Input placeholder="e.g. Panthera tigris" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Sex</Label>
            <Input placeholder="male / female" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Age (years)</Label>
            <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>From Zoo ID</Label>
            <Input placeholder="e.g. zoo-001" value={form.from_zoo_id} onChange={(e) => setForm({ ...form, from_zoo_id: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Button onClick={findMatches} disabled={loading}>{loading ? 'Searching...' : 'Find Matches'}</Button>
          </div>
        </CardContent>
      </Card>

      {sla && (
        <Card>
          <CardHeader><CardTitle>SLA Risk Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Delay Probability</span>
              <Badge variant={riskColor}>{Math.round(sla.delay_probability * 100)}%</Badge>
              {sla.high_risk && <Badge variant="destructive">High Risk</Badge>}
            </div>
            {sla.risk_factors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Risk Factors</p>
                <ul className="text-sm space-y-1">
                  {sla.risk_factors.map((f) => <li key={f} className="flex gap-2">· {f}</li>)}
                </ul>
              </div>
            )}
            {sla.mitigations && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recommended Actions</p>
                <ul className="text-sm space-y-1">
                  {sla.mitigations.map((m) => <li key={m} className="flex gap-2 text-green-600">✓ {m}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {matches.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Zoo Matches</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {matches.map((m, i) => (
              <div key={m.id} className="border rounded-md px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">#{i + 1}</Badge>
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{m.id}</span>
                </div>
                <p className="text-sm text-muted-foreground">{m.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
