import { Badge } from '@/components/ui/badge';
import { LogOut, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { auth } from '@/lib/api';

export type WebTab = 'dashboard' | 'patients' | 'alertes' | 'consultations' | 'rapports';

export default function WebLayout({
  tab,
  onTab,
  title,
  subtitle,
  alertCount,
  children,
  nav,
  onLogout,
  headerExtra,
}: {
  tab: WebTab;
  onTab: (t: WebTab) => void;
  title: string;
  subtitle?: string;
  alertCount?: number;
  children: React.ReactNode;
  nav: { id: WebTab; icon: LucideIcon; label: string; badge?: number }[];
  onLogout: () => void;
  headerExtra?: React.ReactNode;
}) {
  const agent = auth.agent;
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside className="w-64 bg-[#0B1D35] text-white fixed left-0 top-0 h-screen flex flex-col border-r-4 border-[#E8621A] z-50">
        <div className="p-6 border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E8621A] rounded-lg flex items-center justify-center font-bold text-sm">HM</div>
            <div>
              <p className="font-bold text-sm leading-tight">HealthMesh</p>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Emergency Triage</p>
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] mt-3">
            {agent?.prenom} {agent?.nom} · {agent?.role === 'admin' ? 'Admin' : 'Spécialiste'}
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-[#E8621A] text-white shadow-lg' : 'text-[#94A3B8] hover:bg-[#1E3A5F] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
              {badge != null && badge > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center">{badge}</Badge>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#1E3A5F]">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] px-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#00C07F] animate-pulse" />
            API connectée · temps réel
          </div>
          <button type="button" onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-[#94A3B8] hover:text-white hover:bg-[#1E3A5F] rounded-lg text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-[#0B1D35]">{title}</h1>
              {subtitle && <p className="text-sm text-[#64748B]">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {headerExtra}
              <button type="button" className="relative p-2 rounded-lg hover:bg-gray-100" onClick={() => onTab('alertes')}>
                <Bell className="w-5 h-5 text-[#0B1D35]" />
                {(alertCount ?? 0) > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />}
              </button>
              <div className="w-9 h-9 bg-[#E8621A] rounded-full flex items-center justify-center font-bold text-white text-sm">
                {agent?.prenom?.charAt(0) ?? 'S'}
              </div>
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
