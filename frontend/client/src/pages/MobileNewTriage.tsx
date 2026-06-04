/**
 * Page M-03 : Nouveau Triage — connecté au backend HealthMesh
 * Flux réel : création patient + session -> simulateur de capteurs (live via WebSocket)
 *             -> analyse IA TechY-Health -> résultat.
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Activity, Play, Square } from 'lucide-react';
import { api, auth, getSocket } from '@/lib/api';
import { TABLET } from '@/lib/routes';
import TriageBadge from '@/components/health/TriageBadge';
import { triageBorderHex, triageStyle } from '@/lib/health';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';

type Vitals = Record<string, { valeur: number; unite: string; hors_norme: boolean }>;

const SCENARIOS = [
  { name: 'patient_normal', label: 'Patient normal' },
  { name: 'deterioration_lente', label: 'Détérioration progressive' },
  { name: 'crise_aigue', label: 'Crise aiguë' },
  { name: 'fievre_palustre', label: 'Fièvre palustre' },
  { name: 'resolution_alerte', label: 'Résolution (retour normal)' },
];

const LABELS: Record<string, string> = { SpO2: 'SpO2', FC: 'FC', TA_SYS: 'TA sys', TA_DIA: 'TA dia', TEMP: 'Temp', FR: 'FR' };

export default function MobileNewTriage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', age: 30, sex: 'M', weight: '', symptoms: [] as string[], symptomDuration: '' });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState('deterioration_lente');
  const [running, setRunning] = useState(false);
  const [vitals, setVitals] = useState<Vitals>({});
  const [liveLevel, setLiveLevel] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);
  const socketJoined = useRef(false);

  const symptoms = ['Fièvre', 'Douleur thoracique', 'Difficultés respiratoires', 'Nausées', 'Vertiges', 'Blessure'];
  const durations = ['<1h', '1-6h', '6-24h', '>24h'];
  const progressSteps = ['Patient', 'Mesures', 'Analyse IA', 'Résultat'];

  useEffect(() => {
    if (!auth.isAuthenticated) window.location.href = TABLET.login;
  }, []);

  // Abonnement aux mesures live de la session.
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit('rejoindre:session', { session_id: sessionId });
    socketJoined.current = true;
    const onMesure = (m: any) => {
      if (m.session_id !== sessionId) return;
      setVitals((prev) => ({ ...prev, [m.type]: { valeur: m.valeur, unite: m.unite, hors_norme: m.hors_norme } }));
    };
    const onResultat = (r: any) => {
      if (r.session_id === sessionId) setLiveLevel(r.niveau);
    };
    socket.on('mesure:live', onMesure);
    socket.on('triage:resultat', onResultat);
    return () => {
      socket.off('mesure:live', onMesure);
      socket.off('triage:resultat', onResultat);
    };
  }, [sessionId]);

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom) ? prev.symptoms.filter((s) => s !== symptom) : [...prev.symptoms, symptom],
    }));
  };

  async function createPatientAndSession() {
    if (!formData.name.trim()) {
      toast.error('Renseignez le nom du patient');
      return;
    }
    setCreating(true);
    try {
      const [nom, ...rest] = formData.name.trim().split(' ');
      const annee = new Date().getFullYear() - (Number(formData.age) || 0);
      const patient = await api.createPatient({
        nom,
        prenom: rest.join(' ') || undefined,
        sexe: formData.sex,
        poids_kg: formData.weight ? Number(formData.weight) : undefined,
        date_naissance: `${annee}-01-01`,
      });
      const session = await api.createSession({
        patient_id: patient.id,
        symptomes: formData.symptoms,
        duree_symptomes: formData.symptomDuration || undefined,
      });
      setSessionId(session.id);
      setStep(2);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur création patient/session');
    } finally {
      setCreating(false);
    }
  }

  async function toggleSimulator() {
    if (!sessionId) return;
    if (running) {
      await api.stopSimulator(sessionId).catch(() => {});
      setRunning(false);
    } else {
      await api.startScenario(sessionId, scenario, 1500);
      setRunning(true);
      toast.success('Capteurs actifs — mesures en temps réel');
    }
  }

  async function handleAnalyze() {
    if (!sessionId) return;
    setIsAnalyzing(true);
    if (running) await api.stopSimulator(sessionId).catch(() => {});
    setRunning(false);
    try {
      const result = await api.analyze(sessionId);
      setTriageResult(result);
      setStep(4);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erreur d'analyse (ajoutez des mesures)");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ─── Étape 1 : Patient ───────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-full bg-white pb-6 flex flex-col">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#0B1D35]">Nouveau Triage</h1>
            <button onClick={() => (window.location.href = TABLET.dashboard)} className="text-[#94A3B8] hover:text-[#0B1D35]">✕</button>
          </div>
          <div className="flex items-center gap-2">
            {progressSteps.map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-full ${i === step - 1 ? 'bg-[#E8621A]' : 'bg-gray-300'}`} />))}
          </div>
          <div className="flex justify-between text-xs text-[#94A3B8] mt-2">
            {progressSteps.map((s, i) => (<span key={i} className={i === step - 1 ? 'text-[#E8621A] font-semibold' : ''}>{s}</span>))}
          </div>
        </div>

        <div className="px-5 py-6 max-w-4xl mx-auto w-full grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Nom complet</label>
            <Input type="text" placeholder="Ex: Jean Dupont" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-14 text-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Âge</label>
              <Input type="number" min="0" max="120" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })} className="w-full h-12 text-center" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Sexe</label>
              <div className="flex gap-2">
                {['M', 'F', 'Autre'].map((s) => (
                  <button key={s} onClick={() => setFormData({ ...formData, sex: s })} className={`flex-1 h-12 rounded-lg font-semibold transition-all ${formData.sex === s ? 'bg-[#E8621A] text-white' : 'bg-gray-100 text-[#0B1D35] hover:bg-gray-200'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Poids estimé (kg) - Optionnel</label>
            <Input type="number" placeholder="Ex: 70" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full h-12" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Symptômes déclarés</label>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom) => (
                <button key={symptom} onClick={() => handleSymptomToggle(symptom)} className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${formData.symptoms.includes(symptom) ? 'bg-[#E8621A] text-white' : 'bg-gray-100 text-[#0B1D35] hover:bg-gray-200'}`}>{symptom}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Durée des symptômes</label>
            <select value={formData.symptomDuration} onChange={(e) => setFormData({ ...formData, symptomDuration: e.target.value })} className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E8621A]">
              <option value="">Sélectionner</option>
              {durations.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 flex gap-4 max-w-4xl mx-auto w-full">
          <Button variant="outline" onClick={() => (window.location.href = TABLET.dashboard)} className="flex-1 h-14 text-base border-2 border-gray-300 text-[#0B1D35]">Annuler</Button>
          <Button onClick={createPatientAndSession} disabled={creating} className="flex-1 h-14 text-base bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg">
            {creating ? 'Création...' : (<>Suivant <ChevronRight className="w-4 h-4 ml-2" /></>)}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Étape 2 : Mesures (simulateur live) ─────────────────────
  if (step === 2) {
    const hasVitals = Object.keys(vitals).length > 0;
    return (
      <div className="min-h-full bg-white pb-28">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#0B1D35]">Capteurs (simulateur)</h1>
            <button onClick={() => (window.location.href = TABLET.dashboard)} className="text-[#94A3B8] hover:text-[#0B1D35]">✕</button>
          </div>
          <div className="flex items-center gap-2">
            {progressSteps.map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-full ${i <= step - 1 ? 'bg-[#E8621A]' : 'bg-gray-300'}`} />))}
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          <p className="text-sm text-[#94A3B8]">Sélectionnez un profil de patient à simuler, puis démarrez les capteurs. Les mesures arrivent en temps réel.</p>
          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">Profil simulé</label>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)} disabled={running} className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E8621A]">
              {SCENARIOS.map((s) => (<option key={s.name} value={s.name}>{s.label}</option>))}
            </select>
          </div>

          <Button onClick={toggleSimulator} className={`w-full h-12 font-semibold rounded-lg text-white ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-[#E8621A] hover:bg-[#D45A16]'}`}>
            {running ? (<><Square className="w-4 h-4 mr-2" /> Arrêter les capteurs</>) : (<><Play className="w-4 h-4 mr-2" /> Démarrer les capteurs</>)}
          </Button>

          {hasVitals && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#0B1D35]">Mesures en temps réel</h3>
                {liveLevel && <Badge className={liveLevel === 'ROUGE' ? 'bg-red-500 text-white' : liveLevel === 'ORANGE' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}>{liveLevel}</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(vitals).map(([type, v]) => (
                  <div key={type} className="text-center">
                    <p className={`text-2xl font-bold ${v.hors_norme ? 'text-red-600' : 'text-[#0B1D35]'}`}>{v.valeur}</p>
                    <p className="text-xs text-[#94A3B8]">{LABELS[type] || type} {v.unite}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-2 border-gray-300 text-[#0B1D35]"><ChevronLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <Button onClick={() => setStep(3)} disabled={!hasVitals} className="flex-1 h-12 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg disabled:opacity-50">Analyser <ChevronRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </div>
    );
  }

  // ─── Étape 3 : Analyse IA ────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#0B1D35] flex flex-col items-center justify-center px-4">
        {isAnalyzing ? (
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-[#E8621A] animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Analyse IA en cours</h2>
            <p className="text-[#94A3B8] text-sm mb-6">TechY-Health analyse les signes vitaux...</p>
            <div className="w-full max-w-xs h-2 bg-[#1E3A5F] rounded-full overflow-hidden">
              <div className="h-full bg-[#E8621A] rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[#94A3B8] mb-6">Lancer l'analyse TechY-Health sur les mesures collectées.</p>
            <Button onClick={handleAnalyze} className="h-12 px-6 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg">Démarrer l'analyse</Button>
          </div>
        )}
      </div>
    );
  }

  // ─── Étape 4 : Résultat ──────────────────────────────────────
  if (step === 4 && triageResult) {
    const level = triageResult.niveau;
    const colors =
      level === 'ROUGE' ? { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-500' }
      : level === 'ORANGE' ? { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-500' }
      : level === 'VERT' ? { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-500' }
      : { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-500' };
    const confidence = Math.round((triageResult.score_confiance || 0) * 100);

    return (
      <div className="min-h-screen bg-white pb-6">
        <div className={`${triageStyle(level).light} border-b-4 px-4 py-10 text-center`} style={{ borderBottomColor: triageBorderHex(level) }}>
          <div className="flex justify-center mb-3"><TriageBadge level={level} pulse={level === 'ROUGE'} /></div>
          <h1 className={`text-4xl font-bold ${colors.text} mb-2`}>
            {level === 'ROUGE' ? 'URGENCE CRITIQUE' : level === 'ORANGE' ? 'URGENCE ÉLEVÉE' : level === 'VERT' ? 'NON URGENT' : 'INDÉTERMINÉ'}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-2">{triageResult.action_immediate}</p>
        </div>

        <div className="px-4 py-6 space-y-6">
          <Card className="p-4 bg-blue-50 border border-blue-200">
            <p className="text-sm text-[#94A3B8] mb-2">Score de confiance IA ({triageResult.moteur})</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-600">{confidence}%</p>
              <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${confidence}%` }} /></div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-[#E8621A]">
            <p className="text-sm text-[#94A3B8] mb-2">Recommandation</p>
            <p className="font-semibold text-[#0B1D35]">{triageResult.recommandation}</p>
          </Card>

          {triageResult.signes_critiques?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-[#0B1D35] mb-3">Signes critiques détectés</h3>
              <ul className="list-disc pl-5 text-sm text-[#0B1D35] space-y-1">
                {triageResult.signes_critiques.map((s: string, i: number) => (<li key={i}>{s}</li>))}
              </ul>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold text-[#0B1D35] mb-3">Dernières mesures</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {Object.entries(vitals).map(([type, v]) => (
                <div key={type}><p className="text-[#94A3B8] text-xs">{LABELS[type] || type}</p><p className={`font-bold ${v.hors_norme ? 'text-red-600' : 'text-[#0B1D35]'}`}>{v.valeur} {v.unite}</p></div>
              ))}
            </div>
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex flex-col gap-2">
          {(level === 'ROUGE' || level === 'ORANGE') && (
            <Button
              className="w-full h-12 bg-[#0B1D35] hover:bg-[#1E3A5F] text-white font-semibold rounded-lg gap-2"
              onClick={async () => {
                if (!sessionId) return;
                try {
                  const specs = await api.specialists();
                  const spec = specs[0];
                  if (!spec) throw new Error('Aucun spécialiste');
                  await api.createConsultation({ session_id: sessionId, specialiste_id: spec.id });
                  toast.success(`Téléconsultation demandée — Dr ${spec.prenom} ${spec.nom}`);
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || e.message || 'Échec consultation');
                }
              }}
            >
              <Phone className="w-4 h-4" /> Appeler un spécialiste
            </Button>
          )}
          <Button variant="outline" onClick={async () => { if (sessionId) await api.completeSession(sessionId, { niveau_triage: level }).catch(() => {}); window.location.href = TABLET.dashboard; }} className="w-full h-12 border-2 border-gray-300 text-[#0B1D35] font-semibold rounded-lg">Sauvegarder & fermer</Button>
        </div>
      </div>
    );
  }

  return null;
}
