const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, PageBreak, VerticalAlign
  } = require('docx');
  const fs = require('fs');
  
  const C = {
    orange:    "E8621A",
    navy:      "0B1D35",
    green:     "00C07F",
    blue:      "60A5FA",
    gold:      "F4C542",
    red:       "EF4444",
    gray:      "64748B",
    lightGray: "F1F5F9",
    midGray:   "CBD5E1",
    white:     "FFFFFF",
    codeGray:  "1E293B",
    codeTxt:   "7DD3FC",
  };
  
  // ─── helpers ───────────────────────────────────────────
  const b0  = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
  const b1  = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const bO  = { style: BorderStyle.SINGLE, size: 8, color: C.orange };
  const bG  = { style: BorderStyle.SINGLE, size: 8, color: C.green };
  const noBorders = { top:b0, bottom:b0, left:b0, right:b0 };
  const allBorders = { top:b1, bottom:b1, left:b1, right:b1 };
  
  function h1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 480, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.orange, space: 4 } },
      children: [new TextRun({ text, bold: true, size: 38, font: "Arial", color: C.navy })]
    });
  }
  function h2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 140 },
      border: { left: { style: BorderStyle.SINGLE, size: 16, color: C.orange, space: 6 } },
      indent: { left: 180 },
      children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: C.navy })]
    });
  }
  function h3(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 100 },
      children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: C.orange })]
    });
  }
  function h4(text) {
    return new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: C.navy })]
    });
  }
  function body(text, color = C.navy) {
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [new TextRun({ text, size: 22, font: "Arial", color })]
    });
  }
  function note(text) {
    return new Paragraph({
      spacing: { before: 60, after: 60 },
      indent: { left: 360 },
      children: [
        new TextRun({ text: "ℹ  ", size: 20, font: "Arial", color: C.blue }),
        new TextRun({ text, size: 20, font: "Arial", color: C.gray, italics: true })
      ]
    });
  }
  function warn(text) {
    return new Paragraph({
      spacing: { before: 60, after: 60 },
      indent: { left: 360 },
      children: [
        new TextRun({ text: "⚠  ", size: 20, font: "Arial", color: C.gold }),
        new TextRun({ text, size: 20, font: "Arial", color: C.gray, italics: true })
      ]
    });
  }
  function bullet(text) {
    return new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text, size: 22, font: "Arial", color: C.navy })]
    });
  }
  function numbered(text) {
    return new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text, size: 22, font: "Arial", color: C.navy })]
    });
  }
  function code(text) {
    return new Paragraph({
      spacing: { before: 40, after: 40 },
      indent: { left: 360 },
      children: [new TextRun({ text, size: 18, font: "Courier New", color: C.codeTxt })]
    });
  }
  function spacer() {
    return new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun("")] });
  }
  function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
  }
  
  function tbl(headers, rows, colWidths) {
    const total = colWidths.reduce((a,b) => a+b, 0);
    return new Table({
      width: { size: total, type: WidthType.DXA },
      columnWidths: colWidths,
      rows: [
        new TableRow({
          children: headers.map((h, i) => new TableCell({
            borders: allBorders,
            shading: { fill: C.navy, type: ShadingType.CLEAR },
            width: { size: colWidths[i], type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: "Arial", color: C.white })] })]
          }))
        }),
        ...rows.map((row, ri) => new TableRow({
          children: row.map((cell, ci) => new TableCell({
            borders: allBorders,
            shading: { fill: ri % 2 === 0 ? C.white : C.lightGray, type: ShadingType.CLEAR },
            width: { size: colWidths[ci], type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: "Arial", color: C.navy })] })]
          }))
        }))
      ]
    });
  }
  
  function codeBlock(lines) {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({
        children: [new TableCell({
          borders: allBorders,
          shading: { fill: C.codeGray, type: ShadingType.CLEAR },
          width: { size: 9360, type: WidthType.DXA },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: lines.map(l => new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: l, size: 18, font: "Courier New", color: C.codeTxt })]
          }))
        })]
      })]
    });
  }
  
  function sectionBadge(color, label) {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({
        children: [new TableCell({
          borders: noBorders,
          shading: { fill: color, type: ShadingType.CLEAR },
          width: { size: 9360, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 240, right: 240 },
          children: [new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial", color: C.white })]
          })]
        })]
      })]
    });
  }
  
  // ═══════════════════════════════════════════════════════
  // DOCUMENT
  // ═══════════════════════════════════════════════════════
  const doc = new Document({
    numbering: {
      config: [
        { reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ]
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 22, color: C.navy } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 38, bold: true, font: "Arial", color: C.navy },
          paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: C.navy },
          paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: C.orange },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 } },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
  
        // ══════════════════════════════════════════
        // COVER
        // ══════════════════════════════════════════
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1200, after: 120 },
          children: [new TextRun({ text: "HealthMesh Emergency Triage", size: 64, bold: true, font: "Arial", color: C.orange })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: "TechY-Health · Backend & Intelligence Artificielle", size: 32, font: "Arial", color: C.navy })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 600 },
          children: [new TextRun({ text: "Cahier des Charges Technique Complet — Architecture, API, IA, Simulation & Déploiement", size: 22, italics: true, font: "Arial", color: C.gray })]
        }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [new TableRow({
            children: [
              new TableCell({ borders: noBorders, shading: { fill: C.orange, type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 120, right: 120 }, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MVP Phase 1", size: 22, bold: true, font: "Arial", color: C.white })] })] }),
              new TableCell({ borders: noBorders, shading: { fill: C.navy,   type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 120, right: 120 }, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SUPTIC · Yaoundé", size: 22, bold: true, font: "Arial", color: C.white })] })] }),
              new TableCell({ borders: noBorders, shading: { fill: C.green,  type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 120, right: 120 }, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Juin 2026", size: 22, bold: true, font: "Arial", color: C.white })] })] }),
            ]
          })]
        }),
        spacer(), spacer(),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 1. VUE D'ENSEMBLE
        // ══════════════════════════════════════════
        h1("1. Vue d'Ensemble du Backend"),
        body("Ce document décrit l'intégralité du backend nécessaire au fonctionnement de HealthMesh pour le MVP de démonstration et au-delà. Il couvre trois dimensions complémentaires :"),
        spacer(),
        bullet("L'architecture des services (API REST, WebSocket, base de données, stockage)"),
        bullet("L'intelligence artificielle TechY-Health : entraînement, inférence, Edge AI sur tablette"),
        bullet("La simulation des capteurs IoT pour le MVP (avant acquisition de matériel réel)"),
        spacer(),
        note("Pour le pitch et la démo, les capteurs sont simulés par un générateur de données. L'IA peut être un modèle léger ou un appel à un LLM via prompt engineering. En production, les vrais capteurs Bluetooth remplacent le simulateur sans changer une ligne de l'API."),
        spacer(),
  
        h2("1.1 Stack Technologique Retenu"),
        tbl(
          ["Couche", "Technologie", "Justification"],
          [
            ["Runtime API",         "Node.js 20 + Fastify",          "Performant, léger, excellent support WebSocket"],
            ["Base de données",     "PostgreSQL 16 + TimescaleDB",    "TimescaleDB = extension TS pour séries temporelles (mesures vitales)"],
            ["Cache / Pub-Sub",     "Redis 7",                        "Cache requêtes fréquentes + canal temps réel alertes"],
            ["ORM",                 "Prisma",                         "Migrations automatiques, schéma typé, support TS"],
            ["IA Edge",             "ONNX Runtime + modèle léger",    "Tourne sur tablette Android sans connexion"],
            ["IA Cloud",            "Python FastAPI + scikit-learn/XGBoost", "Modèle principal entraîné, servi en API"],
            ["WebSocket",           "Socket.IO",                      "Temps réel bidirectionnel (alertes, signes vitaux live)"],
            ["Authentification",    "JWT + Refresh Token",            "Stateless, adapté mobile"],
            ["Stockage fichiers",   "MinIO (S3-compatible)",          "Auto-hébergeable, pas de dépendance cloud obligatoire"],
            ["Vidéo temps réel",    "WebRTC + médiasoup SFU",         "Peer-to-peer chiffré, fonctionne satellite"],
            ["Conteneurisation",    "Docker + Docker Compose",        "Déploiement reproductible, local ou cloud"],
            ["Monitoring",          "Prometheus + Grafana",           "Métriques système + métriques médicales"],
          ],
          [2000, 2800, 4560]
        ),
        spacer(),
  
        h2("1.2 Architecture Globale des Services"),
        body("Le backend est découpé en microservices indépendants, communiquant via HTTP interne et Redis Pub/Sub. Cette architecture permet de scaler chaque service indépendamment et de faire tourner uniquement les services nécessaires sur le terrain."),
        spacer(),
        tbl(
          ["Service", "Port", "Rôle", "Dépendances"],
          [
            ["api-gateway",    "3000", "Point d'entrée unique, routing, auth JWT", "Tous les services"],
            ["patient-service","3001", "CRUD patients, dossiers médicaux",          "PostgreSQL, Redis"],
            ["triage-service", "3002", "Orchestration du triage, appel IA",         "IA-service, patient-service, Redis"],
            ["ia-service",     "5000", "Inférence TechY-Health, scoring",            "Modèle ONNX/XGBoost, Redis"],
            ["sensor-service", "3003", "Réception données capteurs + simulateur",   "Redis, triage-service"],
            ["alert-service",  "3004", "Génération et diffusion des alertes",        "Redis Pub/Sub, WebSocket"],
            ["video-service",  "3005", "Signaling WebRTC, gestion sessions vidéo",  "médiasoup, Redis"],
            ["sync-service",   "3006", "Sync offline/online, gestion conflits",     "PostgreSQL, Redis"],
            ["report-service", "3007", "Génération rapports, agrégats analytics",   "PostgreSQL TimescaleDB"],
            ["notification-svc","3008","Push notifications, SMS (hors-ligne)",       "Redis, FCM, Twilio"],
          ],
          [2200, 800, 3400, 2960]
        ),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 2. BASE DE DONNÉES
        // ══════════════════════════════════════════
        h1("2. Schéma de Base de Données"),
        body("PostgreSQL avec l'extension TimescaleDB pour les tables de mesures (hypertables partitionnées par timestamp). Toutes les tables incluent created_at, updated_at, deleted_at (soft delete) et un champ sync_status pour la gestion hors-ligne."),
        spacer(),
  
        h2("2.1 Entités Principales"),
        h3("Table : agents"),
        codeBlock([
          "CREATE TABLE agents (",
          "  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  code          VARCHAR(20) UNIQUE NOT NULL,  -- ex: CM-001",
          "  nom           VARCHAR(100) NOT NULL,",
          "  prenom        VARCHAR(100) NOT NULL,",
          "  password_hash TEXT NOT NULL,",
          "  region        VARCHAR(100) NOT NULL,",
          "  zone_id       UUID REFERENCES zones(id),",
          "  role          VARCHAR(20) DEFAULT 'agent',  -- agent | specialiste | admin",
          "  actif         BOOLEAN DEFAULT true,",
          "  derniere_sync TIMESTAMPTZ,",
          "  created_at    TIMESTAMPTZ DEFAULT NOW(),",
          "  updated_at    TIMESTAMPTZ DEFAULT NOW()",
          ");"
        ]),
        spacer(),
        h3("Table : patients"),
        codeBlock([
          "CREATE TABLE patients (",
          "  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  nom             VARCHAR(100) NOT NULL,",
          "  prenom          VARCHAR(100),",
          "  date_naissance  DATE,",
          "  sexe            VARCHAR(10),           -- M | F | Autre",
          "  poids_kg        NUMERIC(5,2),",
          "  zone_id         UUID REFERENCES zones(id),",
          "  agent_ref_id    UUID REFERENCES agents(id),",
          "  antecedents     JSONB DEFAULT '{}',    -- allergies, pathologies, traitements",
          "  contacts_urgence JSONB DEFAULT '[]',",
          "  sync_status     VARCHAR(20) DEFAULT 'synced', -- synced | pending | conflict",
          "  created_at      TIMESTAMPTZ DEFAULT NOW(),",
          "  updated_at      TIMESTAMPTZ DEFAULT NOW(),",
          "  deleted_at      TIMESTAMPTZ           -- soft delete",
          ");"
        ]),
        spacer(),
        h3("Table : sessions_triage"),
        codeBlock([
          "CREATE TABLE sessions_triage (",
          "  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  patient_id      UUID NOT NULL REFERENCES patients(id),",
          "  agent_id        UUID NOT NULL REFERENCES agents(id),",
          "  debut           TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
          "  fin             TIMESTAMPTZ,",
          "  statut          VARCHAR(20) DEFAULT 'en_cours',",
          "                  -- en_cours | complete | abandonne",
          "  symptomes       TEXT[],               -- tableau des symptômes déclarés",
          "  duree_symptomes VARCHAR(20),          -- <1h | 1-6h | 6-24h | >24h",
          "  niveau_triage   VARCHAR(10),          -- ROUGE | ORANGE | VERT | GRIS",
          "  score_ia        NUMERIC(4,3),         -- 0.000 à 1.000 (confiance)",
          "  recommandation  TEXT,                 -- texte généré par l'IA",
          "  signes_critiques JSONB DEFAULT '[]',  -- liste des signes hors norme",
          "  sync_status     VARCHAR(20) DEFAULT 'synced',",
          "  created_at      TIMESTAMPTZ DEFAULT NOW()",
          ");"
        ]),
        spacer(),
        h3("Table : mesures (TimescaleDB hypertable)"),
        codeBlock([
          "CREATE TABLE mesures (",
          "  id               UUID DEFAULT gen_random_uuid(),",
          "  session_id       UUID NOT NULL REFERENCES sessions_triage(id),",
          "  patient_id       UUID NOT NULL REFERENCES patients(id),",
          "  capteur_type     VARCHAR(30) NOT NULL,",
          "                   -- SpO2 | FC | TA_SYS | TA_DIA | TEMP | FR",
          "  valeur           NUMERIC(8,3) NOT NULL,",
          "  unite            VARCHAR(10) NOT NULL,  -- % | bpm | mmHg | °C | /min",
          "  hors_norme       BOOLEAN DEFAULT false,",
          "  delta_reference  NUMERIC(8,3),          -- écart vs référence patient",
          "  source           VARCHAR(20) DEFAULT 'capteur',",
          "                   -- capteur | simulation | saisie_manuelle",
          "  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
          "  sync_status      VARCHAR(20) DEFAULT 'synced'",
          ");",
          "",
          "-- Conversion en hypertable TimescaleDB (partitionnement automatique par temps)",
          "SELECT create_hypertable('mesures', 'timestamp');",
          "",
          "-- Index composé pour requêtes fréquentes",
          "CREATE INDEX ON mesures (patient_id, timestamp DESC);",
          "CREATE INDEX ON mesures (session_id, capteur_type);"
        ]),
        spacer(),
        h3("Table : alertes"),
        codeBlock([
          "CREATE TABLE alertes (",
          "  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  session_id       UUID NOT NULL REFERENCES sessions_triage(id),",
          "  patient_id       UUID NOT NULL REFERENCES patients(id),",
          "  agent_id         UUID NOT NULL REFERENCES agents(id),",
          "  niveau           VARCHAR(10) NOT NULL,  -- ROUGE | ORANGE",
          "  type_alerte      VARCHAR(50),",
          "                   -- SpO2_CRITIQUE | ARYTHMIE | HYPERTENSION | etc.",
          "  valeur_critique  JSONB,                 -- {mesure, valeur, seuil}",
          "  prise_en_charge_par UUID REFERENCES agents(id),  -- spécialiste",
          "  prise_en_charge_at  TIMESTAMPTZ,",
          "  resolue_at          TIMESTAMPTZ,",
          "  notes_resolution    TEXT,",
          "  statut           VARCHAR(20) DEFAULT 'active',",
          "                   -- active | en_cours | resolue",
          "  created_at       TIMESTAMPTZ DEFAULT NOW()",
          ");"
        ]),
        spacer(),
        h3("Table : consultations_video"),
        codeBlock([
          "CREATE TABLE consultations_video (",
          "  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  session_id       UUID REFERENCES sessions_triage(id),",
          "  alerte_id        UUID REFERENCES alertes(id),",
          "  agent_id         UUID NOT NULL REFERENCES agents(id),",
          "  specialiste_id   UUID NOT NULL REFERENCES agents(id),",
          "  debut            TIMESTAMPTZ DEFAULT NOW(),",
          "  fin              TIMESTAMPTZ,",
          "  duree_secondes   INTEGER,",
          "  notes_cliniques  TEXT,",
          "  diagnostic       TEXT,",
          "  recommandations  TEXT,",
          "  room_id          VARCHAR(100),          -- ID room WebRTC",
          "  enregistrement_url TEXT,               -- si consentement donné",
          "  created_at       TIMESTAMPTZ DEFAULT NOW()",
          ");"
        ]),
        spacer(),
  
        h2("2.2 Tables de Référence"),
        tbl(
          ["Table", "Colonnes clés", "Description"],
          [
            ["zones",          "id, nom, region, lat, lng, agent_count",           "Zones géographiques de déploiement"],
            ["seuils_alerte",  "capteur_type, age_min, age_max, val_min, val_max", "Seuils normaux paramétrables par tranche d'âge"],
            ["dispositifs",    "id, type, serial, zone_id, dernier_contact, statut","Registre des capteurs IoT déployés"],
            ["sync_queue",     "id, agent_id, payload JSONB, tentatives, statut",  "File d'attente des données hors-ligne"],
            ["audit_logs",     "id, agent_id, action, entite, payload, ip, ts",    "Traçabilité RGPD de toutes les actions"],
          ],
          [2200, 3400, 3760]
        ),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 3. API REST
        // ══════════════════════════════════════════
        h1("3. API REST — Endpoints Complets"),
        body("Toutes les routes sont préfixées par /api/v1. L'authentification JWT est requise sur toutes les routes sauf /auth/*. Le header Authorization: Bearer <token> est obligatoire."),
        spacer(),
  
        h2("3.1 Authentification"),
        tbl(
          ["Méthode", "Route", "Body / Params", "Réponse", "Rôle requis"],
          [
            ["POST", "/auth/login",          "{code, password, zone_id}",      "{access_token, refresh_token, agent}",  "Public"],
            ["POST", "/auth/refresh",        "{refresh_token}",                 "{access_token}",                        "Public"],
            ["POST", "/auth/logout",         "{refresh_token}",                 "{success: true}",                       "Tous"],
            ["POST", "/auth/offline-token",  "{code, password}",                "{offline_token, expires_in: 7d}",       "Public — usage hors-ligne"],
          ],
          [700, 2200, 2400, 2060, 2000]
        ),
        spacer(),
  
        h2("3.2 Patients"),
        tbl(
          ["Méthode", "Route", "Description", "Rôle"],
          [
            ["GET",    "/patients",              "Liste paginée, filtrée (zone, statut, recherche nom)",       "Agent, Spécialiste"],
            ["POST",   "/patients",              "Créer un nouveau patient",                                    "Agent"],
            ["GET",    "/patients/:id",          "Profil complet + dernier triage + constantes de référence",  "Tous"],
            ["PUT",    "/patients/:id",          "Modifier infos patient",                                      "Agent référent, Admin"],
            ["DELETE", "/patients/:id",          "Soft delete (RGPD)",                                          "Admin"],
            ["GET",    "/patients/:id/mesures",  "Historique mesures avec filtres ?from=&to=&type=",           "Tous"],
            ["GET",    "/patients/:id/triages",  "Historique sessions de triage",                               "Tous"],
            ["GET",    "/patients/:id/alertes",  "Historique des alertes",                                      "Tous"],
            ["GET",    "/patients/search",       "Recherche full-text + QR code scan",                          "Tous"],
          ],
          [700, 2000, 4200, 2460]
        ),
        spacer(),
  
        h2("3.3 Sessions de Triage"),
        tbl(
          ["Méthode", "Route", "Description", "Rôle"],
          [
            ["POST",   "/triage/sessions",              "Démarrer une session (retourne session_id)",              "Agent"],
            ["PUT",    "/triage/sessions/:id",           "Mettre à jour session (symptômes, statut)",              "Agent"],
            ["POST",   "/triage/sessions/:id/mesures",  "Pousser une ou plusieurs mesures (batch possible)",      "Agent, Simulateur"],
            ["POST",   "/triage/sessions/:id/analyze",  "Déclencher l'analyse IA et obtenir le résultat",         "Agent"],
            ["PUT",    "/triage/sessions/:id/complete", "Clôturer la session avec résultat final",                "Agent"],
            ["GET",    "/triage/sessions/:id",           "Récupérer session + toutes les mesures + résultat IA",  "Tous"],
            ["GET",    "/triage/sessions",               "Liste des sessions (filtrées par agent, zone, date)",   "Spécialiste, Admin"],
          ],
          [700, 2600, 3800, 2260]
        ),
        spacer(),
  
        h2("3.4 Alertes"),
        tbl(
          ["Méthode", "Route", "Description", "Rôle"],
          [
            ["GET",    "/alertes",                        "Liste alertes actives (triées par gravité, heure)",     "Spécialiste, Admin"],
            ["GET",    "/alertes/:id",                    "Détail alerte + patient + mesures critiques",           "Tous"],
            ["PUT",    "/alertes/:id/prendre-en-charge",  "Assignation au spécialiste connecté",                  "Spécialiste"],
            ["PUT",    "/alertes/:id/resoudre",           "Marquer comme résolue + notes obligatoires",           "Spécialiste"],
            ["GET",    "/alertes/stats",                  "Statistiques alertes par zone, période, type",         "Admin"],
            ["PUT",    "/alertes/seuils",                 "Modifier les seuils de déclenchement",                 "Admin"],
          ],
          [700, 2600, 3800, 2260]
        ),
        spacer(),
  
        h2("3.5 Consultations Vidéo"),
        tbl(
          ["Méthode", "Route", "Description", "Rôle"],
          [
            ["POST",   "/consultations",          "Initier une consultation (retourne room_id WebRTC)",         "Agent, Spécialiste"],
            ["GET",    "/consultations/:id",      "Détails + notes + statut",                                   "Participants"],
            ["PUT",    "/consultations/:id",      "Mettre à jour notes, diagnostic, recommandations",           "Spécialiste"],
            ["PUT",    "/consultations/:id/end",  "Terminer la consultation + calculer durée",                  "Tous"],
            ["GET",    "/consultations/queue",    "File d'attente des consultations en attente",                "Spécialiste"],
          ],
          [700, 2200, 3800, 2660]
        ),
        spacer(),
  
        h2("3.6 Sync Hors-Ligne"),
        tbl(
          ["Méthode", "Route", "Description"],
          [
            ["POST",   "/sync/push",     "Envoyer un batch de données créées hors-ligne (JSON array)"],
            ["GET",    "/sync/pull",     "Récupérer les mises à jour depuis derniere_sync de l'agent"],
            ["GET",    "/sync/status",   "Vérifier l'état de la file d'attente (combien de records en attente)"],
            ["POST",   "/sync/resolve",  "Résoudre manuellement un conflit de synchronisation"],
          ],
          [700, 1600, 7060]
        ),
        spacer(),
  
        h2("3.7 Rapports & Analytics"),
        tbl(
          ["Méthode", "Route", "Paramètres", "Retour"],
          [
            ["GET", "/reports/activity",     "?from=&to=&zone_id=",           "Triages par jour, par niveau, par agent"],
            ["GET", "/reports/vitals-trend", "?patient_id=&metric=&period=",  "Évolution temporelle d'un signe vital"],
            ["GET", "/reports/epidemio",     "?region=&from=&to=",            "Carte de chaleur symptômes par zone"],
            ["GET", "/reports/agents-kpi",   "?zone_id=&period=",             "Performance agents (nb triages, temps moyen)"],
            ["GET", "/reports/export",       "?type=pdf|csv&from=&to=",       "Export fichier téléchargeable"],
          ],
          [700, 2400, 2600, 3660]
        ),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 4. WEBSOCKET / TEMPS RÉEL
        // ══════════════════════════════════════════
        h1("4. WebSocket — Événements Temps Réel"),
        body("Socket.IO est utilisé pour la communication bidirectionnelle. Le client s'authentifie à la connexion avec son JWT. Les canaux sont des 'rooms' Socket.IO correspondant aux zones géographiques et aux agents."),
        spacer(),
  
        h2("4.1 Événements Serveur → Client"),
        tbl(
          ["Événement", "Payload", "Destinataires", "Déclencheur"],
          [
            ["alerte:nouvelle",         "{alerte, patient, session, mesures_critiques}", "Spécialistes de la zone", "Score IA => ROUGE ou ORANGE"],
            ["alerte:mise_a_jour",      "{alerte_id, statut, specialiste}",              "Tous en zone",            "Prise en charge ou résolution"],
            ["mesure:live",             "{session_id, type, valeur, hors_norme}",        "Agent + spécialiste actif","Capteur envoie une mesure"],
            ["triage:resultat",         "{session_id, niveau, score, recommandation}",   "Agent en session",        "IA retourne résultat"],
            ["consultation:invitation", "{consultation_id, room_id, patient_resume}",    "Spécialiste ciblé",       "Agent initie appel"],
            ["consultation:rejoint",    "{consultation_id, participant}",                "Participants actifs",     "Quelqu'un rejoint la room"],
            ["sync:disponible",         "{nb_enregistrements}",                          "Agent concerné",          "Retour réseau détecté"],
            ["capteur:statut",          "{dispositif_id, statut, derniere_valeur}",      "Agent + Admin",           "Capteur connecté/déconnecté"],
            ["systeme:annonce",         "{message, niveau}",                             "Tous connectés",          "Message admin diffusé"],
          ],
          [2400, 3000, 2000, 1960]
        ),
        spacer(),
  
        h2("4.2 Événements Client → Serveur"),
        tbl(
          ["Événement", "Payload", "Action serveur"],
          [
            ["rejoindre:zone",        "{zone_id}",                       "Inscrit l'agent dans la room de sa zone"],
            ["mesure:push",           "{session_id, mesures[]}",         "Stocke + broadcast aux abonnés + vérifie seuils"],
            ["alerte:prise_en_charge","{alerte_id}",                     "Met à jour l'alerte + notifie l'agent terrain"],
            ["consultation:demarrer", "{session_id, specialiste_id}",    "Crée room WebRTC + envoie invitation"],
            ["capteur:ping",          "{dispositif_id}",                 "Enregistre heartbeat du capteur"],
            ["offline:annonce",       "{agent_id, nb_records_pending}",  "Log état offline de l'agent"],
          ],
          [2400, 2800, 4160]
        ),
        spacer(),
        note("Les rooms Socket.IO correspondent aux zones géographiques (zone:{zone_id}), aux sessions de triage (session:{session_id}) et aux consultations vidéo (consult:{consultation_id}). Un agent rejoint automatiquement sa room de zone à la connexion."),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 5. IA TECHY-HEALTH
        // ══════════════════════════════════════════
        h1("5. Intelligence Artificielle TechY-Health"),
        body("L'IA de triage est le coeur du système. Elle opère à deux niveaux : un modèle léger embarqué sur la tablette (Edge AI) pour le fonctionnement hors-ligne, et un modèle plus complet sur le serveur pour les analyses approfondies."),
        spacer(),
  
        h2("5.1 Stratégie pour le MVP (Démonstration)"),
        body("Pour la démo et le pitch, deux approches sont possibles selon le temps disponible :"),
        spacer(),
        sectionBadge(C.green, "Option A — Recommandée pour le MVP : LLM via Prompt Engineering"),
        spacer(),
        body("On utilise l'API Claude (ou GPT-4) avec un prompt système médical très structuré. L'IA reçoit les signes vitaux et retourne un JSON de triage. C'est déployable en 30 minutes, très convaincant, et suffisamment précis pour une démo."),
        spacer(),
        h3("Prompt Système TechY-Health (LLM)"),
        codeBlock([
          "Tu es TechY-Health, un système d'IA de triage médical d'urgence.",
          "Tu analyses les signes vitaux de patients en zones rurales africaines.",
          "",
          "PROTOCOLE DE TRIAGE (Manchester Triage System adapté) :",
          "  ROUGE   : Danger de mort immédiat — évacuation immédiate requise",
          "  ORANGE  : Urgence élevée — prise en charge sous 30 minutes",  
          "  VERT    : Non urgent — surveillance et soins de base",
          "",
          "SEUILS DE RÉFÉRENCE ADULTE :",
          "  SpO2    : Normal > 95% | Inquiétant 90-95% | Critique < 90%",
          "  FC      : Normal 60-100 bpm | Tachycardie > 100 | Bradycardie < 60",
          "  TA Sys  : Normal 90-140 mmHg | HTA > 160 | Hypotension < 90",
          "  Température : Normal 36-37.5°C | Fièvre > 38.5°C | Hyperthermie > 40°C",
          "",
          "RÈGLES ABSOLUES :",
          "  - SpO2 < 90% = ROUGE automatique, quelle que soit la cause",
          "  - FC > 140 ou < 40 bpm = ROUGE automatique",
          "  - Combinaison SpO2 < 94% + FR > 25 = ROUGE",
          "  - Douleur thoracique + FC anormale = ORANGE minimum",
          "",
          "Retourne UNIQUEMENT ce JSON, sans texte autour :",
          "{",
          "  'niveau': 'ROUGE|ORANGE|VERT',",
          "  'score_confiance': 0.00-1.00,",
          "  'signes_critiques': ['liste des anomalies détectées'],",
          "  'recommandation': 'texte en français pour l agent de santé',",
          "  'action_immediate': 'une action concrète à faire maintenant',",
          "  'transfert_requis': true|false,",
          "  'delai_action_minutes': 0|30|120|null",
          "}"
        ]),
        spacer(),
        sectionBadge(C.navy, "Option B — Production : Modèle ML Entraîné (XGBoost + ONNX)"),
        spacer(),
        body("Pour la production, un modèle supervisé est entraîné sur des données médicales réelles. Il tourne localement sans dépendance à une API externe."),
        spacer(),
  
        h2("5.2 Entraînement du Modèle ML (Option B — Production)"),
        h3("Sources de Données d'Entraînement"),
        bullet("MIMIC-IV (MIT) : base publique de 50 000+ admissions réanimation avec signes vitaux — accès libre pour la recherche"),
        bullet("PhysioNet datasets : données ECG et constantes vitales temps réel de patients hospitalisés"),
        bullet("WHO & MSF datasets : données épidémiologiques Afrique sub-saharienne — adapter aux pathologies locales (paludisme, pneumonie, malnutrition)"),
        bullet("Données synthétiques générées : compléter les classes sous-représentées via simulation (voir section 6)"),
        spacer(),
        h3("Features (Variables d'entrée du modèle)"),
        tbl(
          ["Feature", "Type", "Description", "Importance estimée"],
          [
            ["spo2",              "float",   "Saturation O2 (%)",                      "Très haute"],
            ["fc",                "float",   "Fréquence cardiaque (bpm)",              "Très haute"],
            ["ta_sys",            "float",   "Pression systolique (mmHg)",             "Haute"],
            ["ta_dia",            "float",   "Pression diastolique (mmHg)",            "Haute"],
            ["temperature",       "float",   "Température (°C)",                       "Haute"],
            ["freq_respiratoire", "float",   "Fréquence respiratoire (/min)",          "Haute"],
            ["age",               "integer", "Âge du patient (années)",                "Moyenne"],
            ["sexe",              "binary",  "0=F, 1=M",                               "Faible"],
            ["spo2_delta",        "float",   "Écart SpO2 vs baseline patient",         "Haute"],
            ["fc_variabilite",    "float",   "Variabilité FC sur 60 dernières mesures","Moyenne"],
            ["symptomes_encoded", "int[]",   "Vecteur one-hot des symptômes déclarés", "Moyenne"],
            ["duree_symptomes",   "integer", "Durée en heures (encodée)",              "Faible"],
          ],
          [2200, 900, 2800, 3460]
        ),
        spacer(),
        h3("Pipeline d'Entraînement"),
        codeBlock([
          "# ia_service/train.py",
          "import pandas as pd",
          "from xgboost import XGBClassifier",
          "from sklearn.model_selection import StratifiedKFold",
          "from sklearn.metrics import classification_report",
          "from sklearn.preprocessing import LabelEncoder",
          "import skl2onnx, onnx",
          "",
          "# 1. Chargement et nettoyage des données",
          "df = pd.read_csv('data/training_data.csv')",
          "df = df.dropna(subset=['spo2','fc','ta_sys','niveau_triage'])",
          "df['niveau_triage'] = LabelEncoder().fit_transform(df['niveau_triage'])",
          "# VERT=2, ORANGE=1, ROUGE=0  (ordre de gravité inversé pour XGBoost)",
          "",
          "X = df[FEATURES]",
          "y = df['niveau_triage']",
          "",
          "# 2. Validation croisée stratifiée (classes déséquilibrées)",
          "skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)",
          "model = XGBClassifier(",
          "    n_estimators=300,",
          "    max_depth=6,",
          "    learning_rate=0.05,",
          "    scale_pos_weight=10,   # Surpondérer classe ROUGE (rare mais critique)",
          "    use_label_encoder=False,",
          "    eval_metric='mlogloss'",
          ")",
          "",
          "# 3. Entraînement avec early stopping",
          "model.fit(X_train, y_train,",
          "    eval_set=[(X_val, y_val)],",
          "    early_stopping_rounds=20)",
          "",
          "# 4. Evaluation — seuil de performance minimum requis",
          "# Recall ROUGE doit être >= 0.95 (on préfère 5% faux positifs à 1 manqué)",
          "print(classification_report(y_test, model.predict(X_test)))",
          "",
          "# 5. Export ONNX pour déploiement Edge sur tablette Android",
          "onx = skl2onnx.convert_sklearn(model, 'triage_model',",
          "    initial_types=[('input', FloatTensorType([None, len(FEATURES)]))])",
          "with open('models/techy_health_v1.onnx', 'wb') as f:",
          "    f.write(onx.SerializeToString())"
        ]),
        spacer(),
        h3("Métriques de Validation Requises (avant déploiement production)"),
        tbl(
          ["Métrique", "Classe ROUGE", "Classe ORANGE", "Classe VERT", "Minimum requis"],
          [
            ["Recall (Sensibilité)", ">= 0.95", ">= 0.85", ">= 0.80", "ROUGE critique"],
            ["Précision",           ">= 0.85", ">= 0.80", ">= 0.90", "Limiter faux positifs"],
            ["F1-Score",            ">= 0.90", ">= 0.82", ">= 0.85", "Équilibre global"],
            ["AUC-ROC",             ">= 0.97", ">= 0.90", ">= 0.88", "Discrimination"],
          ],
          [2400, 1600, 1800, 1600, 1960]
        ),
        warn("Le recall sur la classe ROUGE est la métrique la plus critique. Un faux négatif (patient critique classé VERT) est inacceptable. On accepte davantage de faux positifs (patient VERT classé ORANGE) car cela entraîne au pire une consultation inutile."),
        spacer(),
  
        h2("5.3 Service d'Inférence (ia-service)"),
        h3("Endpoint d'Analyse"),
        codeBlock([
          "# ia_service/main.py — FastAPI",
          "from fastapi import FastAPI",
          "import onnxruntime as ort",
          "import numpy as np",
          "",
          "app = FastAPI()",
          "session = ort.InferenceSession('models/techy_health_v1.onnx')",
          "",
          "@app.post('/analyze')",
          "async def analyze(payload: TriagePayload):",
          "    # 1. Préparer le vecteur de features",
          "    features = prepare_features(payload)  # normalisation, encoding",
          "",
          "    # 2. Inférence ONNX",
          "    input_name = session.get_inputs()[0].name",
          "    result = session.run(None, {input_name: features})",
          "    proba = result[1][0]  # probabilités par classe",
          "",
          "    # 3. Appliquer les règles critiques absolues (override IA si nécessaire)",
          "    niveau, score = apply_critical_rules(payload, proba)",
          "",
          "    # 4. Identifier les signes critiques",
          "    signes = identify_critical_signs(payload)",
          "",
          "    # 5. Générer recommandation textuelle",
          "    recommandation = generate_recommendation(niveau, signes, payload)",
          "",
          "    return {",
          "        'niveau': niveau,",
          "        'score_confiance': float(score),",
          "        'signes_critiques': signes,",
          "        'recommandation': recommandation,",
          "        'transfert_requis': niveau == 'ROUGE',",
          "        'delai_action_minutes': get_delay(niveau)",
          "    }",
          "",
          "def apply_critical_rules(payload, proba):",
          "    # Règles absolues qui surchargent le modèle ML",
          "    if payload.spo2 < 90:      return 'ROUGE', 0.99",
          "    if payload.fc > 140:       return 'ROUGE', 0.99",
          "    if payload.fc < 40:        return 'ROUGE', 0.99",
          "    if payload.ta_sys < 80:    return 'ROUGE', 0.95",
          "    if payload.temperature > 40.5: return 'ROUGE', 0.92",
          "    # Sinon utiliser le modèle",
          "    classes = ['ROUGE', 'ORANGE', 'VERT']",
          "    idx = np.argmax(proba)",
          "    return classes[idx], float(proba[idx])"
        ]),
        spacer(),
  
        h2("5.4 Edge AI sur Tablette (Hors-ligne)"),
        body("Le même modèle ONNX est embarqué dans l'app React Native via onnxruntime-react-native. Il tourne directement sur le CPU de la tablette sans connexion."),
        spacer(),
        tbl(
          ["Aspect", "Valeur cible", "Commentaire"],
          [
            ["Taille du modèle", "< 5 Mo",       "XGBoost converti ONNX — très compact"],
            ["Temps d'inférence","< 200ms",       "Sur tablette Android mid-range"],
            ["Consommation RAM", "< 50 Mo",       "ONNX Runtime léger"],
            ["Précision offline","= précision cloud","Même modèle, pas de dégradation"],
            ["Mise à jour",      "OTA automatique","Nouveau modèle téléchargé au retour réseau"],
          ],
          [2400, 2000, 4960]
        ),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 6. SIMULATEUR DE CAPTEURS IoT
        // ══════════════════════════════════════════
        h1("6. Simulateur de Capteurs IoT"),
        body("Pour le MVP, les vrais capteurs Bluetooth (oxymètre, ECG, tensiomètre) sont remplacés par un simulateur logiciel. Ce simulateur génère des données physiologiquement réalistes, incluant des scenarios pathologiques pour déclencher les alertes lors de la démo."),
        spacer(),
  
        h2("6.1 Architecture du Simulateur"),
        body("Le simulateur est un service Node.js indépendant qui expose la même interface que les vrais capteurs. Il peut être configuré pour simuler différents profils de patients."),
        spacer(),
        codeBlock([
          "// sensor-service/simulator.js",
          "const PATIENT_PROFILES = {",
          "  normal: {",
          "    spo2:        { base: 98, drift: 0.5, noise: 0.3 },",
          "    fc:          { base: 72, drift: 2,   noise: 1   },",
          "    ta_sys:      { base: 120, drift: 3,  noise: 2   },",
          "    ta_dia:      { base: 80,  drift: 2,  noise: 1   },",
          "    temperature: { base: 36.8, drift: 0.1, noise: 0.05 },",
          "    freq_resp:   { base: 16,  drift: 1,  noise: 0.5 }",
          "  },",
          "  deterioration_lente: {",
          "    // SpO2 descend progressivement de 97% à 88% en 3 minutes",
          "    spo2:  { base: 97, drift: -0.05, noise: 0.3 },",
          "    fc:    { base: 80, drift:  0.3,  noise: 1   },",
          "    // ... -> déclenche ORANGE puis ROUGE automatiquement",
          "  },",
          "  crise_cardiaque: {",
          "    fc:     { base: 145, drift: 2,   noise: 5   },",
          "    ta_sys: { base: 85,  drift: -1,  noise: 3   },",
          "    spo2:   { base: 91,  drift: -0.2,noise: 0.5 },",
          "    // -> ROUGE immédiat",
          "  },",
          "  fievre_severe: {",
          "    temperature: { base: 39.8, drift: 0.02, noise: 0.1 },",
          "    fc:          { base: 110,  drift: 0.5,  noise: 2   },",
          "    spo2:        { base: 95,   drift: -0.1, noise: 0.3 },",
          "    // -> ORANGE",
          "  },",
          "  stable_post_traitement: {",
          "    // Tous paramètres normaux — pour illustrer résolution alerte",
          "    spo2: { base: 97, drift: 0.1, noise: 0.2 }",
          "    // ... -> VERT",
          "  }",
          "};",
          "",
          "function generateMeasure(profile, capteur, tick) {",
          "  const p = PATIENT_PROFILES[profile][capteur];",
          "  const valeur = p.base + (p.drift * tick) + (Math.random() - 0.5) * p.noise;",
          "  return Math.round(valeur * 10) / 10;  // 1 décimale",
          "}"
        ]),
        spacer(),
  
        h2("6.2 Scenarios de Démo Préconfigurés"),
        tbl(
          ["Scenario", "Durée", "Déclenchement", "But démonstration"],
          [
            ["Scenario 1 : Patient normal",          "2 min",  "SpO2 98%, FC 72, TA 120/80 → VERT",          "Montrer le flux de base, interface propre"],
            ["Scenario 2 : Détérioration progressive","3 min",  "SpO2 97→88%, FC monte → alerte ORANGE→ROUGE","Montrer les alertes temps réel et la téléconsult"],
            ["Scenario 3 : Crise aiguë",             "30 sec", "FC 145, TA 85/55 → ROUGE immédiat",           "Montrer la réactivité de l'alerte critique"],
            ["Scenario 4 : Fièvre palustre",         "2 min",  "T° 39.8°C, FC 110 → ORANGE",                 "Montrer contexte Afrique, recommandation IA"],
            ["Scenario 5 : Résolution alerte",        "2 min",  "Paramètres reviennent à la normale → VERT",  "Montrer fermeture alerte et notes spécialiste"],
          ],
          [2400, 800, 3200, 2960]
        ),
        spacer(),
  
        h2("6.3 API du Simulateur"),
        tbl(
          ["Endpoint", "Body", "Description"],
          [
            ["POST /simulator/start",       "{session_id, profile, interval_ms}",         "Démarre la génération de mesures (push vers sensor-service)"],
            ["POST /simulator/stop",        "{session_id}",                                "Arrête la génération"],
            ["POST /simulator/scenario",    "{session_id, scenario_name}",                 "Lance un scénario préconfiguré"],
            ["PUT  /simulator/inject",      "{session_id, capteur, valeur}",               "Injecter une valeur manuelle (pour démo live)"],
            ["GET  /simulator/status",      "—",                                            "Liste des sessions simulées actives"],
          ],
          [2600, 3200, 3560]
        ),
        spacer(),
        note("En production, le simulateur est désactivé. Le sensor-service reçoit les vraies données via Bluetooth/LoRaWAN par le même contrat d'interface. Aucun changement côté API ou IA."),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 7. GESTION HORS-LIGNE & SYNC
        // ══════════════════════════════════════════
        h1("7. Gestion Hors-Ligne & Synchronisation"),
        body("C'est l'un des différenciateurs clés de HealthMesh. L'application mobile doit fonctionner intégralement sans connexion et synchroniser de manière transparente au retour du réseau."),
        spacer(),
  
        h2("7.1 Stratégie de Stockage Local"),
        tbl(
          ["Donnée", "Stockage local", "Stratégie sync"],
          [
            ["Profils patients",       "SQLite embarqué (via Expo SQLite)",        "Sync complète au login, delta sync ensuite"],
            ["Sessions de triage",     "SQLite — table locale mirror",             "Push immédiat si réseau, sinon queue"],
            ["Mesures vitales",        "SQLite — buffer circulaire 500 entrées",   "Batch push au retour réseau"],
            ["Modèle IA (ONNX)",       "Fichier local — système de fichiers",      "Mise à jour OTA si nouvelle version"],
            ["Alertes envoyées",       "SQLite — log local",                       "Sync prioritaire au retour réseau"],
            ["Tokens auth",            "SecureStore (Expo)",                       "Refresh automatique si réseau disponible"],
            ["Données de référence",   "SQLite — zones, seuils, agents",           "Sync quotidienne ou à la demande"],
          ],
          [2400, 2800, 4160]
        ),
        spacer(),
  
        h2("7.2 Protocole de Synchronisation"),
        h3("Push (Agent → Serveur)"),
        codeBlock([
          "// sync-service/push.js",
          "async function syncPush(agentId, localDb) {",
          "  // 1. Récupérer tous les enregistrements pending",
          "  const pending = await localDb.getAll(",
          "    'SELECT * FROM sync_queue WHERE statut = \"pending\" ORDER BY created_at'",
          "  );",
          "",
          "  // 2. Grouper par type pour batch API",
          "  const batches = groupBy(pending, 'entite'); // patients, mesures, sessions...",
          "",
          "  // 3. Envoyer chaque batch avec retry exponentiel",
          "  for (const [entite, records] of Object.entries(batches)) {",
          "    const response = await apiPost('/sync/push', {",
          "      agent_id: agentId,",
          "      entite,",
          "      records: records.map(r => ({",
          "        ...r.payload,",
          "        client_id: r.local_id,   // Pour résolution de conflits",
          "        created_offline_at: r.created_at",
          "      }))",
          "    });",
          "",
          "    // 4. Marquer comme synced ou conflict",
          "    for (const result of response.results) {",
          "      if (result.status === 'created' || result.status === 'updated') {",
          "        await localDb.update('sync_queue', result.client_id, { statut: 'synced' });",
          "      } else if (result.status === 'conflict') {",
          "        await localDb.update('sync_queue', result.client_id, {",
          "          statut: 'conflict',",
          "          server_version: result.server_version",
          "        });",
          "        // Notifier l'agent d'un conflit à résoudre",
          "      }",
          "    }",
          "  }",
          "}"
        ]),
        spacer(),
        h3("Résolution de Conflits"),
        tbl(
          ["Type de conflit", "Règle de résolution", "Action"],
          [
            ["Patient modifié en offline + modifié sur serveur",  "Last-write-wins sur champs non médicaux", "Fusionner — garder la valeur la plus récente"],
            ["Mesures vitales créées offline",                    "Toujours acceptées (timestamp préservé)",  "Insert avec timestamp offline original"],
            ["Session triage créée offline",                      "Toujours acceptée",                        "Insert — ID local remplacé par UUID serveur"],
            ["Alerte déclenchée offline",                         "Priorité maximale — traitée en premier",  "Insert + notifier spécialiste si encore active"],
          ],
          [3200, 2800, 3360]
        ),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 8. VIDÉO TEMPS RÉEL (WebRTC)
        // ══════════════════════════════════════════
        h1("8. Téléconsultation Vidéo (WebRTC)"),
        body("La vidéo utilise WebRTC pour la transmission peer-to-peer chiffrée. Un serveur SFU (Selective Forwarding Unit) médiasoup permet de gérer plusieurs participants et d'ajouter le partage de données médicales sur le même canal."),
        spacer(),
  
        h2("8.1 Architecture WebRTC"),
        tbl(
          ["Composant", "Technologie", "Rôle"],
          [
            ["Signaling Server",   "Socket.IO (via video-service)", "Échange des SDP offer/answer et ICE candidates"],
            ["SFU Media Server",   "médiasoup (Node.js natif)",     "Routage des flux vidéo/audio sans décodage"],
            ["STUN Server",        "coturn (auto-hébergé)",         "Découverte d'adresse publique (NAT traversal)"],
            ["TURN Server",        "coturn (auto-hébergé)",         "Relai si peer-to-peer impossible (satellite)"],
            ["Chiffrement",        "DTLS-SRTP (natif WebRTC)",      "Chiffrement de bout en bout du média"],
            ["Données médicales",  "DataChannel WebRTC",            "Canal binaire parallèle pour signes vitaux live"],
          ],
          [2200, 2800, 4360]
        ),
        spacer(),
  
        h2("8.2 Flux d'Établissement d'un Appel"),
        numbered("Agent initie : POST /consultations → serveur crée room_id + réserve ressources médiasoup"),
        numbered("Serveur envoie événement Socket.IO consultation:invitation au spécialiste ciblé"),
        numbered("Spécialiste rejoint : GET /consultations/:id/join → reçoit config WebRTC (ICE servers, SDP)"),
        numbered("Échange SDP via Socket.IO (offer/answer) — médiasoup comme intermédiaire"),
        numbered("Échange ICE candidates — coturn comme fallback TURN si satellite"),
        numbered("Établissement du flux vidéo/audio + DataChannel pour mesures vitales"),
        numbered("À la fin : PUT /consultations/:id/end → sauvegarde durée + notes + ferme room médiasoup"),
        spacer(),
  
        h2("8.3 Contraintes Réseau & Adaptations"),
        tbl(
          ["Condition réseau", "Comportement attendu", "Implémentation"],
          [
            ["4G standard",      "Vidéo HD 720p bidirectionnelle",                   "Bitrate adaptatif 500kb-2Mb/s"],
            ["3G / bas débit",   "Vidéo SD 360p + audio prioritaire",                "Simulcast — chute automatique de qualité"],
            ["LoRaWAN / satellite","Audio uniquement + partage de données texte",    "Fallback audio + DataChannel texte/JSON"],
            ["Coupure réseau",   "Gel image + tentative reconnexion auto 3x",        "ICE restart automatique + timer 30s"],
            ["Hors-ligne total", "Appel impossible — afficher message + alternative","UI bloque le bouton + propose SMS/radio"],
          ],
          [2000, 2800, 4560]
        ),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 9. SÉCURITÉ & RGPD
        // ══════════════════════════════════════════
        h1("9. Sécurité & Protection des Données"),
        spacer(),
  
        h2("9.1 Authentification & Autorisation"),
        bullet("JWT access token — expiration 15 minutes"),
        bullet("Refresh token — expiration 7 jours, rotation à chaque usage (invalidation des anciens)"),
        bullet("Offline token — expiration 7 jours, stocké chiffré dans SecureStore sur tablette"),
        bullet("RBAC (Role-Based Access Control) : agent | specialiste | admin — middlewares Fastify"),
        bullet("Rate limiting : 100 req/min par IP sur les routes auth, 1000 req/min ailleurs"),
        bullet("Blacklist des tokens révoqués dans Redis (TTL = durée restante du token)"),
        spacer(),
  
        h2("9.2 Chiffrement des Données"),
        tbl(
          ["Données", "Chiffrement", "Clé"],
          [
            ["Transport HTTP",         "TLS 1.3 obligatoire",                       "Certificat Let's Encrypt"],
            ["Vidéo/audio WebRTC",     "DTLS-SRTP (natif WebRTC)",                  "Négocié par session"],
            ["Données médicales DB",   "AES-256-GCM au niveau colonne (pgcrypto)",  "Clé maître HSM ou env variable"],
            ["Stockage local tablette","SQLite chiffré via SQLCipher",               "Dérivée du PIN agent + device ID"],
            ["Fichiers MinIO",         "SSE-S3 (Server-Side Encryption)",            "Clé MinIO"],
            ["Logs système",           "Pseudonymisation des ID patients",           "Mapping séparé sécurisé"],
          ],
          [2400, 2800, 4160]
        ),
        spacer(),
  
        h2("9.3 Conformité RGPD / Législation Camerounaise"),
        bullet("Consentement explicite requis avant création d'un dossier patient (signature numérique sur tablette)"),
        bullet("Droit à l'oubli : endpoint DELETE /patients/:id déclenche soft delete + flag 'anonymisation_requise'"),
        bullet("Audit log complet de toutes les consultations et accès aux dossiers"),
        bullet("Données stockées sur serveurs au Cameroun (ou Afrique) — pas de transfert UE obligatoire"),
        bullet("Rapport d'accès aux données exportable pour chaque patient sur demande"),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 10. DÉPLOIEMENT
        // ══════════════════════════════════════════
        h1("10. Déploiement & Infrastructure"),
        spacer(),
  
        h2("10.1 Docker Compose — MVP Local"),
        body("Pour le MVP et la démo, tout tourne en local avec Docker Compose. Une seule commande démarre l'ensemble du système."),
        codeBlock([
          "# docker-compose.yml (résumé)",
          "services:",
          "  postgres:",
          "    image: timescale/timescaledb:latest-pg16",
          "    environment:",
          "      POSTGRES_DB: healthmesh",
          "      POSTGRES_PASSWORD: ${DB_PASSWORD}",
          "    volumes: [postgres_data:/var/lib/postgresql/data]",
          "",
          "  redis:",
          "    image: redis:7-alpine",
          "    command: redis-server --requirepass ${REDIS_PASSWORD}",
          "",
          "  api-gateway:",
          "    build: ./services/api-gateway",
          "    ports: ['3000:3000']",
          "    depends_on: [postgres, redis]",
          "    environment:",
          "      JWT_SECRET: ${JWT_SECRET}",
          "      DATABASE_URL: postgresql://...",
          "",
          "  ia-service:",
          "    build: ./services/ia-service",
          "    ports: ['5000:5000']",
          "    volumes: ['./models:/app/models']",
          "",
          "  sensor-simulator:",
          "    build: ./services/sensor-simulator",
          "    ports: ['3003:3003']",
          "    environment:",
          "      TRIAGE_SERVICE_URL: http://triage-service:3002",
          "",
          "  # ... autres services",
          "",
          "  grafana:",
          "    image: grafana/grafana",
          "    ports: ['3100:3000']",
          "    # Dashboard de monitoring visible pendant la démo",
          "",
          "volumes:",
          "  postgres_data:"
        ]),
        spacer(),
  
        h2("10.2 Déploiement Production"),
        tbl(
          ["Composant", "Option recommandée Afrique", "Alternative"],
          [
            ["Serveur principal", "VPS OVH / Scaleway Afrique (datacenter Abidjan)", "AWS Lagos (af-south-1)"],
            ["Base de données",   "PostgreSQL managé (Supabase ou auto-hébergé)",    "RDS PostgreSQL"],
            ["Redis",             "Redis cloud ou auto-hébergé sur même serveur",     "ElastiCache"],
            ["Fichiers",          "MinIO auto-hébergé",                               "Cloudflare R2 (pas de frais sortie)"],
            ["CDN",               "Cloudflare (gratuit)",                             "AWS CloudFront"],
            ["Monitoring",        "Grafana + Prometheus auto-hébergés",               "Grafana Cloud (free tier)"],
            ["CI/CD",             "GitHub Actions → Docker Hub → SSH deploy",         "GitLab CI"],
          ],
          [2200, 3600, 3560]
        ),
        spacer(),
  
        h2("10.3 Ordre de Démarrage pour le MVP"),
        numbered("Cloner le repo + copier .env.example → .env + remplir les secrets"),
        numbered("docker-compose up -d postgres redis — attendre que la DB soit prête"),
        numbered("npx prisma migrate deploy — appliquer le schéma"),
        numbered("npx prisma db seed — injecter données de démo (agents, patients, zones)"),
        numbered("docker-compose up -d — démarrer tous les services"),
        numbered("Vérifier : curl http://localhost:3000/health → { status: 'ok' }"),
        numbered("Lancer le simulateur : POST /simulator/scenario avec scenario_name: 'deterioration_lente'"),
        numbered("Ouvrir le dashboard web : http://localhost:4000 — observer les alertes en temps réel"),
        pageBreak(),
  
        // ══════════════════════════════════════════
        // 11. DONNÉES DE SEED / DÉMO
        // ══════════════════════════════════════════
        h1("11. Données de Seed pour la Démo"),
        body("Un script de seed peuple la base avec des données réalistes pour la démonstration. Ces données illustrent l'impact réel du système."),
        spacer(),
  
        h2("11.1 Données Initiales"),
        tbl(
          ["Entité", "Quantité", "Description"],
          [
            ["Zones",           "5",    "Adamaoua, Nord, Extrême-Nord, Est, Sud — zones rurales Cameroun"],
            ["Agents",          "8",    "4 agents terrain + 3 spécialistes + 1 admin — avec vrais codes CM-xxx"],
            ["Patients",        "25",   "Profils variés : enfants, adultes, femmes enceintes, personnes âgées"],
            ["Sessions triage", "40",   "Historique 30 jours — mix ROUGE / ORANGE / VERT"],
            ["Mesures",         "5000+","Séries temporelles réalistes sur 30 jours"],
            ["Alertes",         "12",   "8 résolues + 4 actives — 2 critiques ROUGE pour impact démo"],
            ["Consultations",   "6",    "Avec notes cliniques et diagnostics réels"],
          ],
          [1600, 1000, 6760]
        ),
        spacer(),
  
        h2("11.2 Comptes de Démo"),
        tbl(
          ["Rôle", "Code / Email", "Mot de passe", "Zone"],
          [
            ["Agent terrain 1",  "CM-001",               "Demo2026!",  "Adamaoua"],
            ["Agent terrain 2",  "CM-002",               "Demo2026!",  "Nord"],
            ["Spécialiste",      "spec@healthmesh.org",  "Demo2026!",  "Yaoundé (toutes zones)"],
            ["Admin",            "admin@healthmesh.org", "Admin2026!", "Global"],
          ],
          [2000, 2800, 2000, 2560]
        ),
        spacer(),
  
        // ══════════════════════════════════════════
        // 12. PLAN DE DÉVELOPPEMENT MVP
        // ══════════════════════════════════════════
        h1("12. Plan de Développement MVP"),
        tbl(
          ["Priorité", "Module", "Effort estimé", "Dépendances"],
          [
            ["P0 — Jour 1",  "Schéma DB + Prisma migrations",            "2h",   "Aucune"],
            ["P0 — Jour 1",  "Auth service (JWT + login)",                "3h",   "DB"],
            ["P0 — Jour 1",  "CRUD patients + triage sessions",           "4h",   "Auth"],
            ["P0 — Jour 2",  "ia-service avec prompt LLM (Option A)",     "2h",   "API Anthropic/OpenAI"],
            ["P0 — Jour 2",  "Simulateur capteurs (5 scenarios)",         "3h",   "triage-service"],
            ["P0 — Jour 2",  "WebSocket alertes temps réel",              "3h",   "Redis, ia-service"],
            ["P0 — Jour 3",  "API sync hors-ligne (push/pull)",           "4h",   "DB, Redis"],
            ["P1 — Jour 4",  "Video-service WebRTC + médiasoup",          "5h",   "Socket.IO"],
            ["P1 — Jour 4",  "Report-service + endpoints analytics",       "3h",   "TimescaleDB"],
            ["P2 — Jour 5",  "Entraînement modèle ML (Option B)",         "1 sem","Données MIMIC-IV"],
            ["P2 — Jour 5",  "Export ONNX + intégration Edge AI tablette","2j",   "Modèle ML entraîné"],
            ["P2 — Futur",   "Blockchain maintenance log",                 "1 sem","Infrastructure"],
          ],
          [1600, 3200, 1600, 2960]
        ),
        spacer(),
        note("Pour le pitch J.U.I.N 2026, les P0 suffisent. Le simulateur + LLM couvrent une démo complète et convaincante en moins d'une semaine de développement."),
        spacer(),
  
        // Footer
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 0 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.orange, space: 4 } },
          children: [new TextRun({ text: "HealthMesh Emergency Triage · TechY-Health AI · SUPTIC / ENSPT Yaoundé · Cameroun", size: 18, font: "Arial", color: C.gray, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 0 },
          children: [new TextRun({ text: "Concours de Pitch J.U.I.N 2026 · Le Numérique, La Technologie et IA au Service du Développement Durable", size: 18, font: "Arial", color: C.gray, italics: true })]
        }),
      ]
    }]
  });
  
  Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("/mnt/user-data/outputs/HealthMesh_Backend_Specifications.docx", buffer);
    console.log("Done!");
  });