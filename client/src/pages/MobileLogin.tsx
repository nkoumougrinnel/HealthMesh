/**
 * Page M-01 : Écran de Connexion (Login)
 * Design: Minimalisme Médical Contemporain
 * - Fond Navy avec logo centré
 * - Formulaire épuré avec validation
 * - Support mode hors-ligne
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MobileLogin() {
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

    if (!agentId.match(/^CM-\d{3}$/)) {
      setError('Format ID invalide. Utilisez CM-XXX');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!region) {
      setError('Veuillez sélectionner une région');
      return;
    }

    setIsLoading(true);
    // Simulation de connexion
    setTimeout(() => {
      setIsLoading(false);
      // Redirection vers dashboard
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B1D35] flex flex-col items-center justify-center px-4 py-8">
      {/* Barre de statut réseau */}
      <div className={`w-full px-4 py-2 flex items-center gap-2 text-sm font-medium mb-8 ${
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

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="text-5xl font-bold text-[#E8621A]">Health</span>
          <span className="text-5xl font-bold text-white">Mesh</span>
        </div>

        {/* Badge */}
        <div className="inline-block border-2 border-[#E8621A] rounded-full px-4 py-2 mb-6">
          <span className="text-xs font-semibold text-white tracking-widest">
            EMERGENCY TRIAGE · IA RURALE
          </span>
        </div>

        {/* Tagline */}
        <p className="text-[#94A3B8] text-sm font-medium">
          Accès aux soins d'urgence pour tous
        </p>
      </div>

      {/* Illustration SVG minimaliste */}
      <div className="mb-12 w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Village */}
          <rect x="40" y="120" width="120" height="60" fill="#1E3A5F" opacity="0.5" />
          <polygon points="60,120 50,90 70,90" fill="#E8621A" opacity="0.7" />
          <polygon points="140,120 130,90 150,90" fill="#E8621A" opacity="0.7" />

          {/* Agent de santé */}
          <circle cx="100" cy="50" r="12" fill="#E8621A" />
          <rect x="94" y="65" width="12" height="25" fill="#E8621A" />
          <rect x="85" y="70" width="30" height="8" fill="#E8621A" opacity="0.8" />
          <rect x="94" y="92" width="5" height="20" fill="#E8621A" />
          <rect x="101" y="92" width="5" height="20" fill="#E8621A" />

          {/* Tablette */}
          <rect x="110" y="60" width="20" height="28" fill="#60A5FA" rx="2" />
          <rect x="112" y="62" width="16" height="22" fill="#FFFFFF" rx="1" />
        </svg>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Erreur */}
        {error && (
          <Alert variant="destructive" className="animate-slide-in-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ID Agent */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Identifiant Agent
          </label>
          <Input
            type="text"
            placeholder="CM-001"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value.toUpperCase())}
            className="w-full bg-white text-[#0B1D35] placeholder-gray-400 h-12 text-center font-mono text-lg tracking-widest"
          />
          <p className="text-xs text-[#94A3B8] mt-1">Format: CM-XXX</p>
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Mot de passe
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white text-[#0B1D35] placeholder-gray-400 h-12"
          />
        </div>

        {/* Région */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Zone de déploiement
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-white text-[#0B1D35] placeholder-gray-400 h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
          >
            <option value="">Sélectionner votre région</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton de connexion */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-[#E8621A] hover:bg-[#D45A16] text-white font-bold text-lg rounded-xl transition-all duration-150 active:scale-95 mt-6"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connexion...</span>
            </div>
          ) : (
            'Se Connecter'
          )}
        </Button>

        {/* Lien mot de passe oublié */}
        <div className="text-center pt-2">
          <a href="#" className="text-[#60A5FA] text-sm hover:underline">
            Mot de passe oublié ?
          </a>
        </div>
      </form>

      {/* Mode hors-ligne */}
      <div className="w-full max-w-sm mt-8 p-4 bg-[#1E3A5F] border border-[#2D5A8C] rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <WifiOff className="w-4 h-4 text-[#E8621A]" />
          <h3 className="font-semibold text-white text-sm">Mode hors-ligne</h3>
        </div>
        <p className="text-xs text-[#94A3B8] mb-3">
          Utiliser les identifiants sauvegardés sur cet appareil
        </p>
        <Button
          type="button"
          onClick={() => setOfflineMode(!offlineMode)}
          className="w-full h-10 border-2 border-white text-white bg-transparent hover:bg-white/10 rounded-lg font-medium text-sm transition-all duration-150"
        >
          Accès Hors-ligne
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-[#94A3B8] text-xs">
        <p>HealthMesh Emergency Triage v1.0</p>
        <p className="mt-1">Powered by TechY-Health AI</p>
      </div>
    </div>
  );
}
