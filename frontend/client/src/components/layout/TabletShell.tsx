import { ClipboardList, Home, LogOut, Plus, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { api, auth } from '@/lib/api';
import { TABLET } from '@/lib/routes';

export default function TabletShell({
  children,
  title,
  onSync,
  syncPending,
}: {
  children: React.ReactNode;
  title?: string;
  onSync?: () => void;
  syncPending?: number;
}) {
  const [path] = useLocation();
  const agent = auth.agent;

  const navItem = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
        active ? 'bg-[#E8621A] text-white shadow-md' : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-full lg:min-h-0 flex flex-1 bg-[#F8FAFC]">
      <aside className="hidden sm:flex w-56 shrink-0 flex-col bg-[#0B1D35] text-white border-r-4 border-[#E8621A]">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">HealthMesh</p>
          <p className="font-bold text-lg leading-tight mt-0.5">Tablette terrain</p>
          <p className="text-xs text-[#64748B] mt-1 truncate">{agent?.code || '—'}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItem(TABLET.dashboard, 'Accueil', <Home className="w-5 h-5" />, path === TABLET.dashboard)}
          {navItem(TABLET.triage, 'Nouveau triage', <Plus className="w-5 h-5" />, path === TABLET.triage)}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#94A3B8] hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
              Synchroniser
              {syncPending != null && syncPending > 0 && (
                <span className="ml-auto w-6 h-6 bg-orange-500 text-xs font-bold rounded-full flex items-center justify-center">{syncPending}</span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await api.logout();
              window.location.href = TABLET.login;
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#94A3B8] hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            Quitter
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {title && (
          <header className="bg-[#0B1D35] text-white px-5 py-4 flex items-center justify-between border-b-4 border-[#E8621A] shrink-0">
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide hidden sm:block">Agent · {agent?.region}</p>
              <p className="font-bold text-xl leading-tight">{title}</p>
            </div>
            <div className="flex items-center gap-3">
              {onSync && (
                <button
                  type="button"
                  onClick={onSync}
                  className="sm:hidden relative p-3 rounded-xl bg-white/10 hover:bg-white/20"
                  title="Synchroniser"
                >
                  <RefreshCw className="w-6 h-6" />
                  {syncPending != null && syncPending > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-orange-500 text-[10px] font-bold rounded-full flex items-center justify-center">
                      {syncPending}
                    </span>
                  )}
                </button>
              )}
              <div className="w-11 h-11 bg-[#E8621A] rounded-full flex items-center justify-center font-bold text-base">
                {agent?.prenom?.charAt(0) ?? 'A'}
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 sm:pb-6">{children}</div>

        <nav className="sm:hidden shrink-0 border-t border-gray-200 bg-white flex items-center justify-around py-2 px-2 safe-area-pb">
          <Link
            href={TABLET.dashboard}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold min-w-[72px] ${
              path === TABLET.dashboard ? 'text-[#E8621A]' : 'text-[#64748B]'
            }`}
          >
            <Home className="w-7 h-7" />
            Accueil
          </Link>
          <Link href={TABLET.triage} className="flex flex-col items-center px-4">
            <span className="w-16 h-16 bg-[#E8621A] hover:bg-[#D45A16] text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ClipboardList className="w-8 h-8" />
            </span>
            <span className="text-xs font-semibold text-[#E8621A] mt-1">Triage</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await api.logout();
              window.location.href = TABLET.login;
            }}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold text-[#64748B] min-w-[72px]"
          >
            <LogOut className="w-7 h-7" />
            Quitter
          </button>
        </nav>
      </div>
    </div>
  );
}
