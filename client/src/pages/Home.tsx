/**
 * Page d'accueil - Navigation vers les maquettes
 * Design: Minimalisme Médical Contemporain
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Smartphone, Monitor, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <div className="bg-[#0B1D35] text-white px-4 py-12 text-center border-b-4 border-[#E8621A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl font-bold text-[#E8621A]">Health</span>
            <span className="text-4xl font-bold text-white">Mesh</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Emergency Triage UI</h1>
          <p className="text-[#94A3B8]">Maquette visuelle complète - Application mobile et tableau de bord web</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Description */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-[#0B1D35] mb-4">Maquettes Disponibles</h2>
          <p className="text-[#94A3B8] max-w-2xl mx-auto">
            Explorez les pages de la maquette visuelle pour l'application HealthMesh Emergency Triage. 
            Découvrez l'interface mobile pour les agents de santé et le tableau de bord web pour les spécialistes.
          </p>
        </div>

        {/* Grille de maquettes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Mobile */}
          <Card className="p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#E8621A] rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1D35]">Application Mobile</h3>
            </div>
            <p className="text-[#94A3B8] mb-6">
              Interface pour les agents de santé communautaires sur le terrain. Gestion des patients, 
              triage d'urgence et téléconsultation avec les spécialistes.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-[#0B1D35] mb-2">Pages incluses :</h4>
                <ul className="text-sm text-[#94A3B8] space-y-1">
                  <li>✓ M-01 : Écran de connexion</li>
                  <li>✓ M-02 : Dashboard terrain</li>
                  <li>✓ M-03 : Nouveau triage avec mesures</li>
                </ul>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => window.location.href = '/mobile/login'}
                  className="w-full h-10 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  Voir la connexion <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => window.location.href = '/mobile/dashboard'}
                  className="w-full h-10 bg-[#0B1D35] hover:bg-[#1E3A5F] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  Voir le dashboard <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => window.location.href = '/mobile/triage'}
                  className="w-full h-10 bg-[#60A5FA] hover:bg-[#3B82F6] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  Voir le triage <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Web */}
          <Card className="p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#E8621A] rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1D35]">Tableau de Bord Web</h3>
            </div>
            <p className="text-[#94A3B8] mb-6">
              Interface pour les spécialistes médicaux distants. Suivi des patients en temps réel, 
              gestion des alertes et consultations vidéo.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-[#0B1D35] mb-2">Pages incluses :</h4>
                <ul className="text-sm text-[#94A3B8] space-y-1">
                  <li>✓ W-01 : Dashboard principal avec KPIs</li>
                  <li>✓ Carte interactive temps réel</li>
                  <li>✓ Graphiques analytiques</li>
                </ul>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => window.location.href = '/web/dashboard'}
                  className="w-full h-10 bg-[#E8621A] hover:bg-[#D45A16] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  Voir le dashboard <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="text-xs text-[#94A3B8] text-center pt-2">
                  Plus de pages à venir (Patients, Consultations, Alertes, etc.)
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Informations de design */}
        <Card className="p-8 bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-bold text-[#0B1D35] mb-4">À propos du design</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold text-[#0B1D35] mb-2">Palette de couleurs</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#E8621A] rounded" />
                  <span className="text-[#94A3B8]">Orange primaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#0B1D35] rounded" />
                  <span className="text-[#94A3B8]">Navy secondaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#EF4444] rounded" />
                  <span className="text-[#94A3B8]">Rouge alerte</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#0B1D35] mb-2">Typographie</p>
              <ul className="text-[#94A3B8] space-y-1">
                <li>Syne 700 - Headings</li>
                <li>DM Sans 400/500 - Body</li>
                <li>Hiérarchie stricte</li>
                <li>Accessibilité WCAG AAA</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-[#0B1D35] mb-2">Principes</p>
              <ul className="text-[#94A3B8] space-y-1">
                <li>Clarté avant tout</li>
                <li>Espace blanc généreux</li>
                <li>Animations subtiles</li>
                <li>Feedback immédiat</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-[#0B1D35] text-white text-center py-8 mt-12 border-t-4 border-[#E8621A]">
        <p className="text-[#94A3B8]">HealthMesh Emergency Triage v1.0</p>
        <p className="text-sm text-[#94A3B8] mt-2">Powered by TechY-Health AI</p>
      </div>
    </div>
  );
}
