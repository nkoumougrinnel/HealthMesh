/**
 * Cadre tablette terrain : plein écran sur appareil, aperçu paysage sur desktop.
 */
import type { ReactNode } from 'react';

export default function TabletFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:min-h-screen lg:flex lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-[#0B1D35] lg:via-[#10243f] lg:to-[#1E3A5F] lg:py-6 lg:px-6">
      <div className="hidden xl:flex flex-col gap-4 mr-10 max-w-sm text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-[#E8621A]">Health</span>
          <span className="text-3xl font-bold text-white">Mesh</span>
        </div>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          Application tablette pour agents de santé communautaires — triage d'urgence, capteurs IoT et IA TechY-Health, même hors-ligne.
        </p>
        <p className="text-xs text-[#64748B]">Format optimisé paysage · tactile · zones rurales</p>
      </div>

      <div className="w-full min-h-screen lg:min-h-0 lg:w-[min(100%,1024px)] lg:h-[min(768px,90vh)] lg:rounded-2xl lg:border-[8px] lg:border-[#1E3A5F] lg:shadow-2xl lg:overflow-hidden lg:bg-[#F8FAFC] lg:relative">
        <div className="h-full min-h-screen lg:min-h-0 lg:overflow-hidden flex flex-col">{children}</div>
      </div>
    </div>
  );
}
