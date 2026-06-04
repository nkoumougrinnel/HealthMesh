/**
 * Dashboard terrain agent — données live + navigation
 */

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff } from 'lucide-react';
import { api, auth, getSocket } from '@/lib/api';
import { ago, ageFromDate, patientName } from '@/lib/health';
import TriageBadge from '@/components/health/TriageBadge';
import KpiCard from '@/components/health/KpiCard';
import TabletShell from '@/components/layout/TabletShell';
import { TABLET } from '@/lib/routes';
import { toast } from 'sonner';

export default function MobileDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncPending, setSyncPending] = useState(0);
  const agent = auth.agent;
  const [stats, setStats] = useState({ patients: 0, alertes: 0, triages: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [patients, alertes, activity, sync] = await Promise.all([
        api.listPatients({ limit: 8 }),
        api.listAlertes(),
        api.activity(),
        api.syncStatus().catch(() => ({ pending: 0 })),
      ]);
      setIsOnline(true);
      setSyncPending(sync.pending ?? 0);
      setStats({
        patients: patients.total ?? patients.items.length,
        alertes: alertes.items.length,
        triages: activity.total ?? 0,
      });
      setAlerts(alertes.items.slice(0, 5));
      setRecentPatients(patients.items);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      window.location.href = TABLET.login;
      return;
    }
    loadAll();
    const socket = getSocket();
    socket.on('connect', () => setIsOnline(true));
    socket.on('disconnect', () => setIsOnline(false));
    socket.on('alerte:nouvelle', (p: any) => {
      toast.error(`Alerte ${p.alerte?.niveau}`, { description: patientName(p.patient || {}) });
      loadAll();
    });
    socket.on('alerte:mise_a_jour', loadAll);
    socket.on('mesure:live', loadAll);
    return () => {
      socket.off('connect', () => setIsOnline(true));
      socket.off('disconnect', () => setIsOnline(false));
      socket.off('alerte:nouvelle', loadAll);
      socket.off('alerte:mise_a_jour', loadAll);
      socket.off('mesure:live', loadAll);
    };
  }, [loadAll]);

  async function handleSync() {
    try {
      await api.syncPull();
      toast.success('Synchronisation effectuée');
      loadAll();
    } catch {
      toast.error('Sync impossible');
    }
  }

  return (
    <TabletShell title={`Bonjour, ${agent?.prenom || 'Agent'}`} onSync={handleSync} syncPending={syncPending}>
      <div className={`px-5 py-2.5 flex items-center gap-2 text-sm font-medium ${isOnline ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
        {isOnline ? <><Wifi className="w-4 h-4" /><span>En ligne · API HealthMesh</span></> : <><WifiOff className="w-4 h-4" /><span>Hors ligne</span></>}
      </div>

      <div className="px-5 py-5 space-y-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Patients" value={stats.patients} accent="border-[#E8621A]" valueClass="text-[#0B1D35]" />
          <KpiCard label="Alertes" value={stats.alertes} accent="border-red-500" valueClass="text-red-600" />
          <KpiCard label="Triages" value={stats.triages} accent="border-[#60A5FA]" valueClass="text-blue-600" />
          <KpiCard label="Sync" value={syncPending === 0 ? 'OK' : syncPending} accent="border-green-500" valueClass="text-green-600" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-bold text-[#0B1D35] mb-3">Alertes actives</h2>
            <div className="space-y-3">
              {alerts.length === 0 && <p className="text-sm text-[#64748B]">Aucune alerte — tout est stable.</p>}
              {alerts.map((a) => (
                <Card key={a.id} className={`p-4 border-l-4 ${a.niveau === 'ROUGE' ? 'border-red-500 bg-red-50/50' : 'border-orange-500 bg-orange-50/50'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-base">{patientName(a.patient || {})}</p>
                      <p className="text-sm text-[#64748B] mt-0.5">{a.typeAlerte || 'Signe critique'} · {ago(a.createdAt)}</p>
                    </div>
                    <TriageBadge level={a.niveau} pulse={a.niveau === 'ROUGE'} />
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1D35] mb-3">Patients récents</h2>
            <div className="space-y-3">
              {recentPatients.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E8621A] text-white font-bold text-lg flex items-center justify-center shrink-0">
                    {p.nom?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate">{patientName(p)}</p>
                    <p className="text-sm text-[#64748B]">{ageFromDate(p.dateNaissance)} ans · {ago(p.createdAt)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </TabletShell>
  );
}
