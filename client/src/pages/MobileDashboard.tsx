/**
 * Page M-02 : Dashboard Terrain (Accueil)
 * Design: Minimalisme Médical Contemporain
 * - Header fixe avec statut réseau
 * - KPI cards
 * - Alertes actives
 * - Patients récents
 * - FAB pour nouveau triage
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Users,
  AlertCircle,
  CheckCircle2,
  Plus,
  Clock,
  Activity,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function MobileDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const agentName = 'Marie';

  // Mock data
  const stats = {
    patientsToday: 12,
    activeAlerts: 3,
    triagesCompleted: 45,
    lastSync: '2 min',
  };

  const alerts = [
    {
      id: 1,
      patient: 'Jean Dupont',
      level: 'ROUGE',
      vital: 'SpO2: 88%',
      time: '5 min',
      color: '#EF4444',
    },
    {
      id: 2,
      patient: 'Marie Sow',
      level: 'ORANGE',
      vital: 'FC: 125 bpm',
      time: '12 min',
      color: '#F97316',
    },
    {
      id: 3,
      patient: 'Pierre Nkomo',
      level: 'ORANGE',
      vital: 'TA: 165/95',
      time: '18 min',
      color: '#F97316',
    },
  ];

  const recentPatients = [
    { id: 1, name: 'Alice Martin', age: 34, triage: 'VERT', time: '1h' },
    { id: 2, name: 'Bob Kanu', age: 67, triage: 'ORANGE', time: '3h' },
    { id: 3, name: 'Celine Mba', age: 28, triage: 'VERT', time: '5h' },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Barre de statut réseau */}
      <div className={`sticky top-0 z-40 px-4 py-2 flex items-center gap-2 text-sm font-medium ${
        isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>En ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Hors-ligne - Sync en attente</span>
          </>
        )}
      </div>

      {/* Header fixe */}
      <div className="sticky top-8 z-40 bg-[#0B1D35] text-white px-4 py-4 flex items-center justify-between border-b-4 border-[#E8621A]">
        <div>
          <p className="text-xs text-[#94A3B8]">Bonjour,</p>
          <p className="text-lg font-bold">{agentName}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative">
            <Bell className="w-6 h-6 text-white" />
            {stats.activeAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {stats.activeAlerts}
              </span>
            )}
          </button>
          <div className="w-9 h-9 bg-[#E8621A] rounded-full flex items-center justify-center font-bold text-white">
            M
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 py-6 space-y-6">
        {/* KPI Cards - Grille 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-l-4 border-[#E8621A]">
            <p className="text-xs text-[#94A3B8] font-medium mb-1">Patients aujourd'hui</p>
            <p className="text-3xl font-bold text-[#0B1D35]">{stats.patientsToday}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-l-4 border-red-500">
            <p className="text-xs text-[#94A3B8] font-medium mb-1">Alertes actives</p>
            <p className="text-3xl font-bold text-red-600">{stats.activeAlerts}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-l-4 border-[#60A5FA]">
            <p className="text-xs text-[#94A3B8] font-medium mb-1">Triages effectués</p>
            <p className="text-3xl font-bold text-blue-600">{stats.triagesCompleted}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500">
            <p className="text-xs text-[#94A3B8] font-medium mb-1">Dernier sync</p>
            <p className="text-2xl font-bold text-green-600">{stats.lastSync}</p>
          </Card>
        </div>

        {/* Alertes Actives */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#0B1D35]">Alertes Actives</h2>
            <Badge className="bg-red-500 text-white">{stats.activeAlerts}</Badge>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className="p-4 border-l-4 animate-slide-in-up"
                style={{ borderLeftColor: alert.color }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-[#0B1D35]">{alert.patient}</p>
                    <p className="text-sm text-[#94A3B8]">{alert.vital}</p>
                  </div>
                  <Badge
                    className={`${
                      alert.level === 'ROUGE'
                        ? 'bg-red-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {alert.level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">{alert.time}</span>
                  <Button className="h-8 px-3 bg-[#E8621A] hover:bg-[#D45A16] text-white text-xs font-semibold rounded-lg">
                    Prendre en charge
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <button className="text-[#60A5FA] text-sm font-semibold mt-2 hover:underline">
            Voir tout →
          </button>
        </div>

        {/* Patients Récents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#0B1D35]">Patients récents</h2>
            <a href="#" className="text-[#60A5FA] text-sm font-semibold hover:underline">
              Voir tous
            </a>
          </div>

          <div className="space-y-2">
            {recentPatients.map((patient) => (
              <Card
                key={patient.id}
                className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-[#E8621A] rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#0B1D35]">{patient.name}</p>
                    <p className="text-xs text-[#94A3B8]">{patient.age} ans • {patient.time}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    patient.triage === 'VERT'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {patient.triage}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FAB - Nouveau Triage */}
      <button className="fixed bottom-6 right-6 w-16 h-16 bg-[#E8621A] hover:bg-[#D45A16] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-150 active:scale-95 z-50">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
