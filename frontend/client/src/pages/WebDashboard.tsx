/**
 * Console spécialiste / admin — exploitation complète du backend HealthMesh
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Users, Phone, AlertCircle, FileText, Activity, Download, Search, MapPin,
} from 'lucide-react';
import { api, auth, getSocket } from '@/lib/api';
import { TABLET } from '@/lib/routes';
import { ago, patientName, triageBorderHex, triageStyle } from '@/lib/health';
import TriageBadge from '@/components/health/TriageBadge';
import KpiCard from '@/components/health/KpiCard';
import WebLayout, { type WebTab } from '@/components/layout/WebLayout';
import { toast } from 'sonner';

const CHART_COLORS = { ROUGE: '#EF4444', ORANGE: '#F97316', VERT: '#22C55E', GRIS: '#94A3B8' };

export default function WebDashboard() {
  const [tab, setTab] = useState<WebTab>('dashboard');
  const [kpis, setKpis] = useState({ patients: 0, alertes: 0, rouges: 0, triages: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [urgencyPie, setUrgencyPie] = useState<any[]>([]);
  const [dailyChart, setDailyChart] = useState<any[]>([]);
  const [epidemio, setEpidemio] = useState<Record<string, Record<string, number>>>({});
  const [agentsKpi, setAgentsKpi] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [vitalsChart, setVitalsChart] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [p, alertes, activity, daily, consults, q, epi, agents] = await Promise.all([
        api.listPatients({ limit: 50 }),
        api.listAlertes(),
        api.activity(),
        api.activityDaily(),
        api.listConsultations(),
        api.consultationQueue().catch(() => ({ items: [] })),
        api.epidemio(),
        api.agentsKpi().catch(() => ({ items: [] })),
      ]);
      const rouges = alertes.items.filter((a: any) => a.niveau === 'ROUGE').length;
      setKpis({
        patients: p.total ?? p.items.length,
        alertes: alertes.items.length,
        rouges,
        triages: activity.total ?? 0,
      });
      setAlerts(alertes.items);
      setPatients(p.items);
      setConsultations(consults.items || []);
      setQueue(q.items || []);
      setEpidemio(epi.heatmap || {});
      setAgentsKpi(agents.items || []);
      const colorMap = CHART_COLORS;
      setUrgencyPie(
        (activity.par_niveau || [])
          .filter((g: any) => g.niveauTriage)
          .map((g: any) => ({ name: g.niveauTriage, value: g._count, color: colorMap[g.niveauTriage as keyof typeof colorMap] || '#94A3B8' }))
      );
      setDailyChart(daily.items || []);
    } catch {
      toast.error('Impossible de charger les données');
    }
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      window.location.href = TABLET.login;
      return;
    }
    if (auth.agent?.role === 'agent') {
      window.location.href = TABLET.dashboard;
      return;
    }
    loadAll();
    const socket = getSocket();
    const onNew = (payload: any) => {
      toast.error(`Alerte ${payload.alerte?.niveau}`, { description: patientName(payload.patient || {}) });
      loadAll();
    };
    socket.on('alerte:nouvelle', onNew);
    socket.on('alerte:mise_a_jour', loadAll);
    socket.on('consultation:invitation', () => {
      toast.info('Nouvelle demande de consultation');
      loadAll();
    });
    return () => {
      socket.off('alerte:nouvelle', onNew);
      socket.off('alerte:mise_a_jour', loadAll);
      socket.off('consultation:invitation', loadAll);
    };
  }, [loadAll]);

  async function takeCharge(id: string) {
    await api.prendreEnCharge(id);
    toast.success('Prise en charge enregistrée');
    loadAll();
  }
  async function resolveAlert(id: string) {
    const notes = window.prompt('Notes de résolution :', 'Patient stabilisé après téléconsultation.');
    if (!notes) return;
    await api.resoudreAlerte(id, notes);
    toast.success('Alerte résolue');
    loadAll();
  }
  async function endConsult(id: string) {
    await api.endConsultation(id);
    toast.success('Consultation terminée');
    loadAll();
  }
  async function searchPatients() {
    if (!searchQ.trim()) {
      const p = await api.listPatients({ limit: 50 });
      setPatients(p.items);
      return;
    }
    const r = await api.searchPatients(searchQ);
    setPatients(r.items);
  }
  async function openPatient(id: string) {
    const p = await api.getPatient(id);
    setSelectedPatient(p);
    const trend = await api.vitalsTrend(id, 'SpO2');
    setVitalsChart(trend.points || []);
  }

  const nav = [
    { id: 'dashboard' as WebTab, icon: LayoutDashboard, label: 'Vue d\'ensemble' },
    { id: 'patients' as WebTab, icon: Users, label: 'Patients' },
    { id: 'alertes' as WebTab, icon: AlertCircle, label: 'Alertes', badge: kpis.alertes },
    { id: 'consultations' as WebTab, icon: Phone, label: 'Consultations', badge: queue.length },
    { id: 'rapports' as WebTab, icon: FileText, label: 'Rapports' },
  ];

  const titles: Record<WebTab, { t: string; s: string }> = {
    dashboard: { t: 'Vue d\'ensemble', s: 'KPIs, alertes et activité temps réel' },
    patients: { t: 'Patients', s: 'Recherche, dossiers et courbes SpO2' },
    alertes: { t: 'Alertes', s: 'Prise en charge et résolution' },
    consultations: { t: 'Consultations', s: 'File d\'attente et historique vidéo' },
    rapports: { t: 'Rapports', s: 'Épidémiologie, agents et export CSV' },
  };

  return (
    <WebLayout
      tab={tab}
      onTab={setTab}
      title={titles[tab].t}
      subtitle={titles[tab].s}
      alertCount={kpis.alertes}
      nav={nav}
      onLogout={async () => {
        await api.logout();
        window.location.href = TABLET.login;
      }}
      headerExtra={
        tab === 'rapports' ? (
          <Button variant="outline" size="sm" onClick={() => api.downloadExport()} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        ) : null
      }
    >
      {tab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Patients" value={kpis.patients} icon={Users} accent="border-[#60A5FA]" valueClass="text-blue-600" />
            <KpiCard label="Alertes actives" value={kpis.alertes} icon={AlertCircle} accent="border-orange-500" valueClass="text-orange-600" />
            <KpiCard label="Critiques ROUGE" value={kpis.rouges} sub="Priorité maximale" icon={Activity} accent="border-red-500" valueClass="text-red-600" />
            <KpiCard label="Triages total" value={kpis.triages} icon={LayoutDashboard} accent="border-[#00C07F]" valueClass="text-green-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-bold text-[#0B1D35] mb-4">Activité — 14 derniers jours</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="jour" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ROUGE" stackId="a" fill={CHART_COLORS.ROUGE} />
                  <Bar dataKey="ORANGE" stackId="a" fill={CHART_COLORS.ORANGE} />
                  <Bar dataKey="VERT" stackId="a" fill={CHART_COLORS.VERT} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Alertes récentes</h2>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {alerts.slice(0, 6).map((a) => (
                  <div key={a.id} className={`p-3 rounded-lg border-l-4 ${triageStyle(a.niveau).light}`} style={{ borderLeftColor: triageBorderHex(a.niveau) }}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-semibold text-sm">{patientName(a.patient || {})}</p>
                      <TriageBadge level={a.niveau} pulse={a.niveau === 'ROUGE'} />
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">{ago(a.createdAt)} · {a.statut}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'patients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-4 space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Rechercher un patient..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchPatients()} />
              <Button onClick={searchPatients} size="icon" variant="outline"><Search className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {patients.map((p) => (
                <button key={p.id} type="button" onClick={() => openPatient(p.id)} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatient?.id === p.id ? 'border-[#E8621A] bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <p className="font-semibold text-sm">{patientName(p)}</p>
                  <p className="text-xs text-[#64748B]">{p.zone?.nom || 'Zone —'} · {ago(p.createdAt)}</p>
                </button>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-2 p-6">
            {selectedPatient ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold">{patientName(selectedPatient)}</h2>
                  <p className="text-sm text-[#64748B]">Dernier triage : {selectedPatient.dernier_triage?.niveauTriage || '—'}</p>
                </div>
                {selectedPatient.dernier_triage && <TriageBadge level={selectedPatient.dernier_triage.niveauTriage} />}
                <div>
                  <h3 className="font-semibold mb-2">Courbe SpO2</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={vitalsChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleDateString('fr-FR')} />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="valeur" stroke="#E8621A" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-[#64748B]">{selectedPatient.recommandation || selectedPatient.dernier_triage?.recommandation || ''}</p>
              </div>
            ) : (
              <p className="text-[#64748B] text-center py-20">Sélectionnez un patient pour voir le dossier et la courbe SpO2.</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'alertes' && (
        <div className="space-y-4">
          {alerts.map((a) => (
            <Card key={a.id} className={`p-4 border-l-4 ${a.niveau === 'ROUGE' ? 'border-red-500' : 'border-orange-500'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-lg">{patientName(a.patient || {})}</p>
                    <TriageBadge level={a.niveau} pulse={a.statut === 'active' && a.niveau === 'ROUGE'} />
                  </div>
                  <p className="text-sm text-[#64748B]">{a.typeAlerte || 'Alerte médicale'} · {ago(a.createdAt)} · {a.statut}</p>
                </div>
                <div className="flex gap-2">
                  {a.statut === 'active' && (
                    <Button size="sm" onClick={() => takeCharge(a.id)}>Prendre en charge</Button>
                  )}
                  {a.statut === 'en_cours' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => resolveAlert(a.id)}>Résoudre</Button>
                  )}
                  {a.statut === 'resolue' && <span className="text-sm text-green-600 font-semibold py-2">Résolue</span>}
                </div>
              </div>
            </Card>
          ))}
          {alerts.length === 0 && <p className="text-center text-[#64748B] py-12">Aucune alerte active.</p>}
        </div>
      )}

      {tab === 'consultations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">File d'attente ({queue.length})</h2>
            {queue.map((c) => (
              <div key={c.id} className="p-3 border rounded-lg mb-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">Room {c.roomId}</p>
                  <p className="text-xs text-[#64748B]">{c.statut} · {ago(c.createdAt)}</p>
                </div>
                {c.statut !== 'terminee' && (
                  <Button size="sm" variant="outline" onClick={() => endConsult(c.id)}>Terminer</Button>
                )}
              </div>
            ))}
            {queue.length === 0 && <p className="text-sm text-[#64748B]">File vide.</p>}
          </Card>
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Historique récent</h2>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {consultations.slice(0, 15).map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium">{c.agent?.prenom} → {c.specialiste?.prenom}</p>
                  <p className="text-xs text-[#64748B]">{c.statut} · {c.dureeSecondes ? `${c.dureeSecondes}s` : ago(c.debut)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'rapports' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-bold mb-4">Répartition des triages</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={urgencyPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {urgencyPie.map((e, i) => (<Cell key={i} fill={e.color} />))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Symptômes par zone</h2>
              <div className="max-h-[260px] overflow-y-auto text-sm space-y-3">
                {Object.entries(epidemio).map(([zone, syms]) => (
                  <div key={zone}>
                    <p className="font-semibold text-[#0B1D35]">{zone}</p>
                    <ul className="text-[#64748B] mt-1">
                      {Object.entries(syms).slice(0, 5).map(([s, n]) => (
                        <li key={s}>{s}: {n}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="p-6">
            <h2 className="font-bold mb-4">Performance agents (KPI)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[#64748B]">
                    <th className="py-2">Code</th>
                    <th className="py-2">Agent</th>
                    <th className="py-2">Triages</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsKpi.map((row) => (
                    <tr key={row.agent?.id} className="border-b border-gray-100">
                      <td className="py-2 font-mono">{row.agent?.code}</td>
                      <td className="py-2">{row.agent?.prenom} {row.agent?.nom}</td>
                      <td className="py-2 font-bold">{row.nb_triages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </WebLayout>
  );
}
