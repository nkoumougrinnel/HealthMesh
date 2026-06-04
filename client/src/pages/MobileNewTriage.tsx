/**
 * Page M-03 : Nouveau Triage — Collecte des Signes Vitaux
 * Design: Minimalisme Médical Contemporain
 * - Barre de progression multi-étapes
 * - Formulaires guidés
 * - Connexion Bluetooth aux capteurs
 * - Mesures en temps réel
 * - Résultat du triage avec IA
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  Activity,
  Droplet,
  Heart,
  Thermometer,
  Wind,
} from 'lucide-react';

export default function MobileNewTriage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    sex: 'M',
    weight: '',
    symptoms: [] as string[],
    symptomDuration: '',
  });

  const [sensors, setSensors] = useState({
    oximeter: { connected: false, value: null },
    ecg: { connected: false, value: null },
    bp: { connected: false, systolic: null, diastolic: null },
    temp: { connected: false, value: null },
    respRate: { connected: false, value: null },
  });

  const [triageResult, setTriageResult] = useState<{
    level: string;
    confidence: number;
    summary: string;
    recommendation: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const symptoms = ['Fièvre', 'Douleur thoracique', 'Difficultés respiratoires', 'Nausées', 'Vertiges', 'Blessure'];
  const durations = ['< 1h', '1-6h', '6-24h', '> 24h'];

  const progressSteps = ['Patient', 'Mesures', 'Analyse IA', 'Résultat'];

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleConnectSensor = (sensorKey: string) => {
    setTimeout(() => {
      setSensors((prev) => ({
        ...prev,
        [sensorKey]: {
          ...prev[sensorKey as keyof typeof sensors],
          connected: true,
          ...(sensorKey === 'oximeter' && { value: 96 }),
          ...(sensorKey === 'ecg' && { value: 72 }),
          ...(sensorKey === 'bp' && { systolic: 120, diastolic: 80 }),
          ...(sensorKey === 'temp' && { value: 37.2 }),
          ...(sensorKey === 'respRate' && { value: 16 }),
        },
      }));
    }, 1000);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setTriageResult({
        level: 'VERT',
        confidence: 94,
        summary: 'Patient stable avec signes vitaux normaux',
        recommendation: 'Suivi standard recommandé',
      });
      setStep(4);
    }, 3000);
  };

  // Étape 1 : Identification du Patient
  if (step === 1) {
    return (
      <div className="min-h-screen bg-white pb-6">
        {/* Barre de progression */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#0B1D35]">Nouveau Triage</h1>
            <button className="text-[#94A3B8] hover:text-[#0B1D35]">✕</button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {progressSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    i < step ? 'bg-[#E8621A]' : i === step - 1 ? 'bg-[#E8621A]' : 'bg-gray-300'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[#94A3B8] mt-2">
            {progressSteps.map((s, i) => (
              <span key={i} className={i < step ? 'text-[#E8621A] font-semibold' : ''}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="px-4 py-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">
              Nom complet
            </label>
            <Input
              type="text"
              placeholder="Ex: Jean Dupont"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#0B1D35] mb-2">
                Âge
              </label>
              <Input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full h-12 text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1D35] mb-2">
                Sexe
              </label>
              <div className="flex gap-2">
                {['M', 'F', 'Autre'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormData({ ...formData, sex: s })}
                    className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                      formData.sex === s
                        ? 'bg-[#E8621A] text-white'
                        : 'bg-gray-100 text-[#0B1D35] hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">
              Poids estimé (kg) - Optionnel
            </label>
            <Input
              type="number"
              placeholder="Ex: 70"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">
              Symptômes déclarés
            </label>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.symptoms.includes(symptom)
                      ? 'bg-[#E8621A] text-white'
                      : 'bg-gray-100 text-[#0B1D35] hover:bg-gray-200'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B1D35] mb-2">
              Durée des symptômes
            </label>
            <select
              value={formData.symptomDuration}
              onChange={(e) => setFormData({ ...formData, symptomDuration: e.target.value })}
              className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
            >
              <option value="">Sélectionner</option>
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boutons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-300 text-[#0B1D35]"
          >
            Annuler
          </Button>
          <Button
            onClick={() => setStep(2)}
            className="flex-1 h-12 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg"
          >
            Suivant <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Étape 2 : Mesures
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white pb-6">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#0B1D35]">Connexion Capteurs</h1>
            <button className="text-[#94A3B8] hover:text-[#0B1D35]">✕</button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {progressSteps.map((s, i) => (
              <div key={i} className="flex-1 h-2 rounded-full bg-gray-300" />
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="px-4 py-6 space-y-4">
          <p className="text-sm text-[#94A3B8]">
            Connectez les capteurs Bluetooth pour collecter les signes vitaux
          </p>

          {/* Capteurs */}
          {[
            { key: 'oximeter', name: 'Oxymètre', icon: Droplet, color: 'text-blue-500' },
            { key: 'ecg', name: 'ECG', icon: Heart, color: 'text-red-500' },
            { key: 'bp', name: 'Tensiomètre', icon: Activity, color: 'text-orange-500' },
            { key: 'temp', name: 'Thermomètre', icon: Thermometer, color: 'text-yellow-500' },
            { key: 'respRate', name: 'Fréquence Respiratoire', icon: Wind, color: 'text-green-500' },
          ].map(({ key, name, icon: Icon, color }) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${color}`} />
                  <div>
                    <p className="font-semibold text-[#0B1D35]">{name}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {sensors[key as keyof typeof sensors].connected
                        ? 'Connecté'
                        : 'Déconnecté'}
                    </p>
                  </div>
                </div>
                {sensors[key as keyof typeof sensors].connected ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Button
                    onClick={() => handleConnectSensor(key)}
                    className="h-8 px-3 bg-[#E8621A] hover:bg-[#D45A16] text-white text-xs font-semibold rounded-lg"
                  >
                    <Bluetooth className="w-3 h-3 mr-1" />
                    Connecter
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {/* Mesures en temps réel */}
          {Object.values(sensors).some((s) => s.connected) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-[#0B1D35] mb-3">Mesures en temps réel</h3>
              <div className="grid grid-cols-2 gap-3">
                {sensors.oximeter.connected && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{sensors.oximeter.value}%</p>
                    <p className="text-xs text-[#94A3B8]">SpO2</p>
                  </div>
                )}
                {sensors.ecg.connected && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{sensors.ecg.value} bpm</p>
                    <p className="text-xs text-[#94A3B8]">FC</p>
                  </div>
                )}
                {sensors.bp.connected && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {sensors.bp.systolic}/{sensors.bp.diastolic}
                    </p>
                    <p className="text-xs text-[#94A3B8]">TA (mmHg)</p>
                  </div>
                )}
                {sensors.temp.connected && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{sensors.temp.value}°C</p>
                    <p className="text-xs text-[#94A3B8]">Temp</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <Button
            onClick={() => setStep(1)}
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-300 text-[#0B1D35]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={() => setStep(3)}
            disabled={!sensors.oximeter.connected || !sensors.ecg.connected}
            className="flex-1 h-12 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg disabled:opacity-50"
          >
            Analyser <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Étape 3 : Analyse IA
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#0B1D35] flex flex-col items-center justify-center px-4">
        {isAnalyzing ? (
          <>
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-[#E8621A] animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Analyse IA en cours</h2>
              <p className="text-[#94A3B8] text-sm mb-6">
                {['Analyse des signes vitaux...', 'Comparaison aux protocoles...', 'Calcul du triage...'][
                  Math.floor(Math.random() * 3)
                ]}
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-xs h-2 bg-[#1E3A5F] rounded-full overflow-hidden">
                <div className="h-full bg-[#E8621A] rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>

            <p className="text-[#94A3B8] text-xs text-center">
              Powered by TechY-Health AI
            </p>
          </>
        ) : (
          <Button
            onClick={handleAnalyze}
            className="h-12 px-6 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg"
          >
            Démarrer l'analyse
          </Button>
        )}
      </div>
    );
  }

  // Étape 4 : Résultat
  if (step === 4 && triageResult) {
    const getResultColor = (level: string) => {
      switch (level) {
        case 'ROUGE':
          return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-500' };
        case 'ORANGE':
          return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-500' };
        case 'VERT':
          return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-500' };
        default:
          return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-500' };
      }
    };

    const colors = getResultColor(triageResult.level);

    return (
      <div className="min-h-screen bg-white pb-6">
        {/* Bandeau résultat */}
        <div className={`${colors.bg} border-b-4 ${colors.border} px-4 py-12 text-center`}>
          <Badge className={`${colors.badge} text-white mb-4 text-lg px-4 py-2`}>
            {triageResult.level}
          </Badge>
          <h1 className={`text-5xl font-bold ${colors.text} mb-2`}>
            {triageResult.level === 'ROUGE'
              ? 'URGENCE CRITIQUE'
              : triageResult.level === 'ORANGE'
              ? 'URGENCE ÉLEVÉE'
              : 'NON URGENT'}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-2">{triageResult.summary}</p>
        </div>

        {/* Contenu */}
        <div className="px-4 py-6 space-y-6">
          {/* Score de confiance */}
          <Card className="p-4 bg-blue-50 border border-blue-200">
            <p className="text-sm text-[#94A3B8] mb-2">Score de confiance IA</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-600">{triageResult.confidence}%</p>
              <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${triageResult.confidence}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Recommandation */}
          <Card className="p-4 border-l-4 border-[#E8621A]">
            <p className="text-sm text-[#94A3B8] mb-2">Recommandation</p>
            <p className="font-semibold text-[#0B1D35]">{triageResult.recommendation}</p>
          </Card>

          {/* Signes vitaux */}
          <Card className="p-4">
            <h3 className="font-semibold text-[#0B1D35] mb-3">Signes vitaux enregistrés</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#94A3B8] text-xs">SpO2</p>
                <p className="font-bold text-[#0B1D35]">96%</p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-xs">FC</p>
                <p className="font-bold text-[#0B1D35]">72 bpm</p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-xs">TA</p>
                <p className="font-bold text-[#0B1D35]">120/80</p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-xs">Temp</p>
                <p className="font-bold text-[#0B1D35]">37.2°C</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Boutons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-300 text-[#0B1D35] font-semibold rounded-lg"
          >
            Sauvegarder & fermer
          </Button>
          <Button className="flex-1 h-12 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg">
            Appeler un spécialiste
          </Button>
        </div>
      </div>
    );
  }
}
