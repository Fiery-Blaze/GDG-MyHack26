import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { runAgent } from '@/api/client'

interface HealthRecord {
  id: number
  test_name: string
  result: string
  record_date: string
  vet_clinic: string
  zoonotic_flag: boolean
}

interface Passport {
  microchip_id: string
  animal?: { name: string; species: string; sex: string; age: number }
  health_records: HealthRecord[]
  transfers: unknown[]
}

export default function HealthPassport() {
  const [microchipId, setMicrochipId] = useState('')
  const [passport, setPassport] = useState<Passport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ test_name: '', result: '', date: '', vet_clinic: '', zoonotic_flag: false })
  const [adding, setAdding] = useState(false)

  async function fetchPassport() {
    if (!microchipId) return
    setLoading(true)
    setError('')
    try {
      const res = await runAgent('health_passport', { microchip_id: microchipId, requester_role: 'owner' })
      setPassport(res.data)
    } catch {
      setError('Failed to fetch passport.')
    } finally {
      setLoading(false)
    }
  }

  async function addRecord() {
    if (!microchipId) return
    setAdding(true)
    try {
      await runAgent('health_record', { microchip_id: microchipId, ...form })
      await fetchPassport()
      setForm({ test_name: '', result: '', date: '', vet_clinic: '', zoonotic_flag: false })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Health Passport</h2>
        <p className="text-muted-foreground">View and manage animal health records</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Search by Microchip ID</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Input placeholder="e.g. MC-001" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} />
          <Button onClick={fetchPassport} disabled={loading}>{loading ? 'Loading...' : 'Search'}</Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {passport && (
        <>
          {passport.animal && (
            <Card>
              <CardHeader><CardTitle>Animal Profile</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{passport.animal.name}</p></div>
                <div><p className="text-muted-foreground">Species</p><p className="font-medium">{passport.animal.species}</p></div>
                <div><p className="text-muted-foreground">Sex</p><p className="font-medium">{passport.animal.sex}</p></div>
                <div><p className="text-muted-foreground">Age</p><p className="font-medium">{passport.animal.age} yrs</p></div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Health Records ({passport.health_records.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {passport.health_records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records yet.</p>
              ) : passport.health_records.map((r) => (
                <div key={r.id} className="flex items-center justify-between border rounded-md px-4 py-2">
                  <div>
                    <p className="text-sm font-medium">{r.test_name}</p>
                    <p className="text-xs text-muted-foreground">{r.vet_clinic} · {r.record_date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={r.result === 'negative' ? 'secondary' : 'destructive'}>{r.result}</Badge>
                    {r.zoonotic_flag && <Badge variant="destructive">Zoonotic</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add Health Record</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Test Name</Label>
                <Input value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Result</Label>
                <Input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Vet Clinic</Label>
                <Input value={form.vet_clinic} onChange={(e) => setForm({ ...form, vet_clinic: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Button onClick={addRecord} disabled={adding}>{adding ? 'Saving...' : 'Add Record'}</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
