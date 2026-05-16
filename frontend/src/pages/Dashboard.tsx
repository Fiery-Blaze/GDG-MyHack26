import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { runAgent } from '@/api/client'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
  const [slaEvents, setSlaEvents] = useState<{ id: number; status: string; deadline: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runAgent('sla_monitor', {})
      .then((res) => setSlaEvents(res.data?.events ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Live overview of transfers and SLA status</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Transfers</CardTitle>
            <Clock size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{slaEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Monitored by SLA agent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle size={16} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {slaEvents.filter((e) => e.status === 'at_risk').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Deadline within 1 hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Missed SLAs</CardTitle>
            <CheckCircle size={16} className="text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {slaEvents.filter((e) => e.status === 'missed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate action</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SLA Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : slaEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active SLA events.</p>
          ) : (
            <div className="space-y-2">
              {slaEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between border rounded-md px-4 py-2">
                  <span className="text-sm">Transfer #{e.id}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{new Date(e.deadline).toLocaleString()}</span>
                    <Badge variant={e.status === 'missed' ? 'destructive' : 'secondary'}>
                      {e.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
