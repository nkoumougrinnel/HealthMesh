/**
 * Portail d'accès HealthMesh — application connectée au backend
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tablet, Monitor, ArrowRight, Activity } from 'lucide-react';
import { api, auth, BASE_URL } from '@/lib/api';
import { TABLET } from '@/lib/routes';

export default function Home() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(setBackendOk);
    if (auth.isAuthenticated) {
      const a = auth.agent;
      if (a?.role === 'agent') window.location.href = TABLET.dashboard;
      else window.location.href = '/web/dashboard';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-[#0B1D35] text-white border-b-4 border-[#E8621A]">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="text-4xl font-bold text-[#E8621A]">Health</span>
            <span className="text-4xl font-bold">Mesh</span>
          </div>
          <p className="text-[#94A3B8] max-w-xl mx-auto">Triage d'urgence assisté par IA · Temps réel · Zones rurales Cameroun</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/10">
            <span className={`w-2 h-2 rounded-full ${backendOk ? 'bg-[#00C07F] animate-pulse' : backendOk === false ? 'bg-red-500' : 'bg-gray-400'}`} />
            {backendOk ? `Backend connecté (${BASE_URL})` : backendOk === false ? 'Backend injoignable — lancez le serveur API' : 'Vérification…'}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 border-t-4 border-[#E8621A] shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#E8621A] rounded-xl flex items-center justify-center">
                <Tablet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0B1D35]">Tablette terrain</h2>
                <p className="text-xs text-[#64748B]">Agents CM-xxx · format paysage</p>
              </div>
            </div>
            <p className="text-sm text-[#64748B] mb-6">Triage tactile, simulateur de capteurs, analyse TechY-Health, sync hors-ligne.</p>
            <div className="space-y-2">
              <Button onClick={() => (window.location.href = TABLET.login)} className="w-full bg-[#E8621A] hover:bg-[#D45A16] h-11 gap-2">
                Connexion agent (tablette) <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-[#94A3B8]">Démo : CM-001 / Demo2026!</p>
            </div>
          </Card>

          <Card className="p-8 border-t-4 border-[#0B1D35] shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#0B1D35] rounded-xl flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0B1D35]">Console spécialiste</h2>
                <p className="text-xs text-[#64748B]">Médecins & admin</p>
              </div>
            </div>
            <p className="text-sm text-[#64748B] mb-6">Alertes live, patients, consultations, rapports et export CSV.</p>
            <div className="space-y-2">
              <Button onClick={() => (window.location.href = TABLET.login)} className="w-full bg-[#0B1D35] hover:bg-[#1E3A5F] h-11 gap-2">
                Connexion spécialiste <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-[#94A3B8]">Démo : spec@healthmesh.org / Demo2026!</p>
            </div>
          </Card>
        </div>

        <Card className="mt-10 p-6 bg-white border border-gray-200">
          <div className="flex items-start gap-3">
            <Activity className="w-6 h-6 text-[#E8621A] shrink-0 mt-0.5" />
            <div className="text-sm text-[#64748B]">
              <p className="font-semibold text-[#0B1D35] mb-1">Fonctionnalités actives</p>
              <ul className="grid sm:grid-cols-2 gap-1 list-disc list-inside">
                <li>Auth JWT + rôles</li>
                <li>IA triage (règles Manchester)</li>
                <li>Simulateur IoT (5 scénarios)</li>
                <li>WebSocket alertes live</li>
                <li>Consultations vidéo</li>
                <li>Rapports & export</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
