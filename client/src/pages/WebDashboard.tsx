/**
 * Page W-01 : Dashboard Principal (Web)
 * Design: Minimalisme Médical Contemporain
 * - Sidebar gauche fixe
 * - Header avec navigation
 * - KPI cards
 * - Carte interactive
 * - Alertes en temps réel
 * - Graphiques analytiques
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Phone,
  AlertCircle,
  FileText,
  Map,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Activity,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Clock,
} from 'lucide-react';

export default function WebDashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Mock data
  const kpis = [
    { label: 'Patients actifs', value: 156, trend: '+12%', color: 'text-blue-600' },
    { label: 'Consultations en cours', value: 8, trend: '+2', color: 'text-orange-600' },
    { label: 'Alertes critiques', value: 3, trend: 'ROUGE', color: 'text-red-600' },
    { label: 'Cliniques connectées', value: '24/28', trend: '85%', color: 'text-green-600' },
  ];

  const alerts = [
    {
      id: 1,
      level: 'ROUGE',
      patient: 'Jean Dupont',
      agent: 'Marie Sow',
      clinic: 'Poste Yaoundé',
      vital: 'SpO2: 88%',
      time: '5 min',
    },
    {
      id: 2,
      level: 'ORANGE',
      patient: 'Marie Kanu',
      agent: 'Pierre Nkomo',
      clinic: 'Poste Douala',
      vital: 'FC: 125 bpm',
      time: '12 min',
    },
    {
      id: 3,
      level: 'ORANGE',
      patient: 'Alice Mba',
      agent: 'Sophie Tagne',
      clinic: 'Poste Buea',
      vital: 'TA: 165/95',
      time: '18 min',
    },
  ];

  const triageData = [
    { day: 'Lun', ROUGE: 2, ORANGE: 5, VERT: 18 },
    { day: 'Mar', ROUGE: 1, ORANGE: 4, VERT: 22 },
    { day: 'Mer', ROUGE: 3, ORANGE: 6, VERT: 19 },
    { day: 'Jeu', ROUGE: 2, ORANGE: 7, VERT: 21 },
    { day: 'Ven', ROUGE: 4, ORANGE: 8, VERT: 25 },
    { day: 'Sam', ROUGE: 1, ORANGE: 3, VERT: 16 },
    { day: 'Dim', ROUGE: 2, ORANGE: 4, VERT: 14 },
  ];

  const urgencyData = [
    { name: 'ROUGE', value: 15, color: '#EF4444' },
    { name: 'ORANGE', value: 37, color: '#F97316' },
    { name: 'VERT', value: 135, color: '#22C55E' },
  ];

  const spO2Data = [
    { clinic: 'Yaoundé', avg: 96 },
    { clinic: 'Douala', avg: 95 },
    { clinic: 'Buea', avg: 94 },
    { clinic: 'Bafoussam', avg: 97 },
    { clinic: 'Garoua', avg: 93 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B1D35] text-white fixed left-0 top-0 h-screen flex flex-col border-r-4 border-[#E8621A]">
        {/* Header Sidebar */}
        <div className="p-6 border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#E8621A] rounded-lg flex items-center justify-center font-bold">
              HM
            </div>
            <div>
              <p className="font-bold text-sm">HealthMesh</p>
              <p className="text-xs text-[#94A3B8]">Spécialiste</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Users, label: 'Patients' },
            { icon: Phone, label: 'Consultations' },
            { icon: AlertCircle, label: 'Alertes', badge: 3 },
            { icon: FileText, label: 'Rapports' },
            { icon: Map, label: 'Cliniques' },
            { icon: Settings, label: 'Paramètres' },
          ].map(({ icon: Icon, label, active, badge }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-[#E8621A] text-white'
                  : 'text-[#94A3B8] hover:bg-[#1E3A5F] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
              {badge && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">{badge}</Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#1E3A5F] space-y-2">
          <div className="text-xs text-[#94A3B8] px-4 py-2">
            <p className="font-semibold">Statut système</p>
            <p className="text-green-400 mt-1">● En ligne</p>
          </div>
          <button className="w-full flex items-center gap-2 px-4 py-3 text-[#94A3B8] hover:text-white transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="ml-64 flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1D35]">Dashboard</h1>
              <p className="text-sm text-[#94A3B8]">Accueil › Vue d'ensemble</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Recherche */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-[#0B1D35]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profil */}
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-[#E8621A] rounded-full flex items-center justify-center font-bold text-white text-sm">
                  DR
                </div>
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-[#94A3B8] font-medium">{kpi.label}</p>
                    <p className={`text-3xl font-bold ${kpi.color} mt-2`}>{kpi.value}</p>
                  </div>
                  <Activity className={`w-8 h-8 ${kpi.color} opacity-20`} />
                </div>
                <p className={`text-xs font-semibold ${kpi.color}`}>{kpi.trend}</p>
              </Card>
            ))}
          </div>

          {/* Carte et Alertes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carte */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-bold text-[#0B1D35] mb-4">Carte Temps Réel</h2>
              <div className="w-full h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-[#94A3B8] text-sm">Carte interactive - 28 cliniques</p>
                  <p className="text-xs text-[#94A3B8] mt-1">3 alertes actives</p>
                </div>
              </div>
            </Card>

            {/* Alertes Récentes */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-[#0B1D35] mb-4">Alertes Récentes</h2>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border-l-4 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderLeftColor:
                        alert.level === 'ROUGE' ? '#EF4444' : '#F97316',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm text-[#0B1D35]">
                        {alert.patient}
                      </p>
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
                    <p className="text-xs text-[#94A3B8] mb-1">{alert.vital}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {alert.agent} • {alert.clinic}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-[#94A3B8]">{alert.time}</span>
                      <Button className="h-6 px-2 bg-[#E8621A] hover:bg-[#D45A16] text-white text-xs rounded">
                        Démarrer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Triages par jour */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-bold text-[#0B1D35] mb-4">Triages par jour</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={triageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ROUGE" stackId="a" fill="#EF4444" />
                  <Bar dataKey="ORANGE" stackId="a" fill="#F97316" />
                  <Bar dataKey="VERT" stackId="a" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Répartition des urgences */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-[#0B1D35] mb-4">Répartition</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tendance SpO2 */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-[#0B1D35] mb-4">Tendance SpO2 par clinique</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spO2Data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="clinic" />
                <YAxis domain={[90, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#E8621A"
                  strokeWidth={2}
                  dot={{ fill: '#E8621A', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
