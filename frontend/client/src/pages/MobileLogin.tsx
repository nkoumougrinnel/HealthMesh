/**
 * Connexion tablette terrain — auth JWT + token hors-ligne
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, auth, BASE_URL } from '@/lib/api';
import { TABLET } from '@/lib/routes';

export default function MobileLogin() {
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(setBackendOk);
  }, []);

  const regions = [
    'Centre',
    'Littoral',
    'Nord',
    'Nord-Ouest',
    'Ouest',
    'Est',
    'Sud',
    'Sud-Ouest',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isCode = /^CM-\d{3}$/.test(agentId);
    const isEmail = agentId.includes('@');
    if (!isCode && !isEmail) {
      setError('Identifiant invalide. Utilisez CM-XXX ou un email.');
      return;
    }
    if (password.length < 6) {
      setError('Mot de passe trop court');
      return;
    }

    setIsLoading(true);
    try {
      const agent = await api.login(agentId, password, region || undefined);
      window.location.href = agent.role === 'agent' ? TABLET.dashboard : '/web/dashboard';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Identifiants incorrects ou serveur injoignable');
      setIsLoading(false);
    }
  };

  const handleOfflineAccess = () => {
    if (auth.isAuthenticated && auth.agent) {
      window.location.href = auth.agent.role === 'agent' ? TABLET.dashboard : '/web/dashboard';
      return;
    }
    if (auth.offlineToken && auth.agent) {
      window.location.href = TABLET.dashboard;
      return;
    }
    setError('Aucune session locale. Connectez-vous une fois en ligne pour activer le mode hors-ligne.');
  };

  const fillDemo = (id: string) => {
    setAgentId(id);
    setPassword('Demo2026!');
  };

  return (
    <div className="min-h-full bg-[#0B1D35] flex flex-col lg:flex-row lg:items-stretch">
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-center px-10 py-12 border-r border-[#2D5A8C]">
        <div className="flex items-center gap-1 mb-6">
          <span className="text-4xl font-bold text-[#E8621A]">Health</span>
          <span className="text-4xl font-bold text-white">Mesh</span>
        </div>
        <p className="text-[#94A3B8] text-base leading-relaxed max-w-md">
          Connexion tablette terrain — triage, capteurs et sync pour agents en zone rurale.
        </p>
        <p className="mt-6 text-xs text-[#64748B]">Interface optimisée paysage · cibles tactiles élargies</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:py-12">
      <div
        className={`w-full max-w-sm px-4 py-2 flex items-center gap-2 text-sm font-medium mb-6 rounded-lg ${
          backendOk === true
            ? 'bg-green-900/40 text-green-300'
            : backendOk === false
              ? 'bg-orange-900/40 text-orange-300'
              : 'bg-white/10 text-[#94A3B8]'
        }`}
      >
        {backendOk === true ? (
          <>
            <Wifi className="w-4 h-4 shrink-0" />
            <span>API connectée · {BASE_URL.replace(/^https?:\/\//, '')}</span>
          </>
        ) : backendOk === false ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Backend injoignable — mode hors-ligne limité</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Vérification du serveur…</span>
          </>
        )}
      </div>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="text-5xl font-bold text-[#E8621A]">Health</span>
          <span className="text-5xl font-bold text-white">Mesh</span>
        </div>
        <div className="inline-block border-2 border-[#E8621A] rounded-full px-4 py-2 mb-4">
          <span className="text-xs font-semibold text-white tracking-widest">EMERGENCY TRIAGE · IA RURALE</span>
        </div>
        <p className="text-[#94A3B8] text-sm font-medium">Accès aux soins d'urgence pour tous</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5">
        {error && (
          <Alert variant="destructive" className="animate-slide-in-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">Identifiant</label>
          <Input
            type="text"
            placeholder="CM-001 ou email"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value.toUpperCase())}
            className="w-full bg-white text-[#0B1D35] placeholder-gray-400 h-12 text-center font-mono text-lg tracking-widest"
          />
          <p className="text-xs text-[#94A3B8] mt-1">Agent CM-XXX ou spécialiste (email)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Mot de passe</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white text-[#0B1D35] placeholder-gray-400 h-12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Zone de déploiement</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-white text-[#0B1D35] h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
          >
            <option value="">Sélectionner votre région</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-[#E8621A] hover:bg-[#D45A16] text-white font-bold text-lg rounded-xl transition-all duration-150 active:scale-95 mt-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connexion...</span>
            </div>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>

      <div className="w-full max-w-sm mt-6 p-4 bg-[#1E3A5F]/80 border border-[#2D5A8C] rounded-xl">
        <p className="text-xs font-semibold text-[#E8621A] mb-2 uppercase tracking-wide">Comptes démo</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fillDemo('CM-001')} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
            Agent CM-001
          </button>
          <button type="button" onClick={() => fillDemo('spec@healthmesh.org')} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
            Spécialiste
          </button>
        </div>
        <p className="text-[10px] text-[#64748B] mt-2">Mot de passe : Demo2026!</p>
      </div>

      <div className="w-full max-w-sm mt-4 p-4 bg-[#1E3A5F] border border-[#2D5A8C] rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <WifiOff className="w-4 h-4 text-[#E8621A]" />
          <h3 className="font-semibold text-white text-sm">Mode hors-ligne</h3>
        </div>
        <p className="text-xs text-[#94A3B8] mb-3">
          Reprendre une session déjà enregistrée sur cet appareil (après une connexion en ligne).
        </p>
        <Button
          type="button"
          onClick={handleOfflineAccess}
          variant="outline"
          className="w-full h-10 border-2 border-white text-white bg-transparent hover:bg-white/10 rounded-lg font-medium text-sm"
        >
          Accès hors-ligne
        </Button>
      </div>

      <div className="text-center mt-8 text-[#94A3B8] text-xs">
        <p>HealthMesh · Tablette terrain v1.0</p>
        <p className="mt-1">Powered by TechY-Health AI</p>
      </div>
      </div>
    </div>
  );
}
