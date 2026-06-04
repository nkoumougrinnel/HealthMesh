/** Utilitaires et styles partagés HealthMesh (triage, temps, noms). */

export type TriageLevel = 'ROUGE' | 'ORANGE' | 'VERT' | 'GRIS' | string;

export const TRIAGE = {
  ROUGE: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500', light: 'bg-red-50', label: 'Urgence vitale' },
  ORANGE: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500', light: 'bg-orange-50', label: 'Urgence élevée' },
  VERT: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500', light: 'bg-green-50', label: 'Non urgent' },
  GRIS: { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-400', light: 'bg-slate-50', label: 'Indéterminé' },
} as const;

export function triageStyle(level?: string | null) {
  return TRIAGE[(level as keyof typeof TRIAGE) || 'GRIS'] || TRIAGE.GRIS;
}

const TRIAGE_HEX: Record<string, string> = {
  ROUGE: '#EF4444',
  ORANGE: '#F97316',
  VERT: '#22C55E',
  GRIS: '#94A3B8',
};

export function triageBorderHex(level?: string | null) {
  return TRIAGE_HEX[level || ''] || TRIAGE_HEX.GRIS;
}

export function patientName(p: { nom?: string; prenom?: string | null }) {
  return `${p.nom || ''} ${p.prenom || ''}`.trim() || 'Patient';
}

export function ago(d?: string | null) {
  if (!d) return '';
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export function ageFromDate(d?: string | null) {
  if (!d) return '—';
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000)));
}
