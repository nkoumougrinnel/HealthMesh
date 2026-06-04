import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const UNITES = { SpO2: "%", FC: "bpm", TA_SYS: "mmHg", TA_DIA: "mmHg", TEMP: "°C", FR: "/min" };

function rand(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Nettoyage...");
  // Ordre inverse des dependances.
  await prisma.consultationVideo.deleteMany();
  await prisma.mesure.deleteMany();
  await prisma.alerte.deleteMany();
  await prisma.sessionTriage.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.syncQueue.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.dispositif.deleteMany();
  await prisma.seuilAlerte.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.zone.deleteMany();

  // ─── Zones ───────────────────────────────────────────
  console.log("Zones...");
  const zonesData = [
    { nom: "Adamaoua", region: "Adamaoua", lat: 7.32, lng: 13.58 },
    { nom: "Nord", region: "Nord", lat: 9.3, lng: 13.4 },
    { nom: "Extreme-Nord", region: "Extreme-Nord", lat: 10.6, lng: 14.3 },
    { nom: "Est", region: "Est", lat: 4.58, lng: 13.68 },
    { nom: "Sud", region: "Sud", lat: 2.92, lng: 11.15 },
  ];
  const zones = [];
  for (const z of zonesData) zones.push(await prisma.zone.create({ data: z }));

  // ─── Agents ──────────────────────────────────────────
  console.log("Agents...");
  const hashDemo = await bcrypt.hash("Demo2026!", 10);
  const hashAdmin = await bcrypt.hash("Admin2026!", 10);

  const agents = [];
  agents.push(await prisma.agent.create({ data: { code: "CM-001", nom: "Bello", prenom: "Aliou", passwordHash: hashDemo, region: "Adamaoua", zoneId: zones[0].id, role: "agent" } }));
  agents.push(await prisma.agent.create({ data: { code: "CM-002", nom: "Ngono", prenom: "Marie", passwordHash: hashDemo, region: "Nord", zoneId: zones[1].id, role: "agent" } }));
  agents.push(await prisma.agent.create({ data: { code: "CM-003", nom: "Oumarou", prenom: "Fatima", passwordHash: hashDemo, region: "Extreme-Nord", zoneId: zones[2].id, role: "agent" } }));
  agents.push(await prisma.agent.create({ data: { code: "CM-004", nom: "Essomba", prenom: "Jean", passwordHash: hashDemo, region: "Est", zoneId: zones[3].id, role: "agent" } }));
  const spec1 = await prisma.agent.create({ data: { code: "SPEC-01", email: "spec@healthmesh.org", nom: "Dr. Kamga", prenom: "Paul", passwordHash: hashDemo, region: "Centre", zoneId: null, role: "specialiste" } });
  const spec2 = await prisma.agent.create({ data: { code: "SPEC-02", email: "spec2@healthmesh.org", nom: "Dr. Mballa", prenom: "Sophie", passwordHash: hashDemo, region: "Centre", zoneId: null, role: "specialiste" } });
  const spec3 = await prisma.agent.create({ data: { code: "SPEC-03", email: "spec3@healthmesh.org", nom: "Dr. Tchamba", prenom: "Eric", passwordHash: hashDemo, region: "Centre", zoneId: null, role: "specialiste" } });
  const admin = await prisma.agent.create({ data: { code: "ADMIN-01", email: "admin@healthmesh.org", nom: "Admin", prenom: "HealthMesh", passwordHash: hashAdmin, region: "Global", role: "admin" } });
  agents.push(spec1, spec2, spec3, admin);

  // MAJ compteur zones.
  for (const z of zones) {
    const count = await prisma.agent.count({ where: { zoneId: z.id } });
    await prisma.zone.update({ where: { id: z.id }, data: { agentCount: count } });
  }

  // ─── Seuils d'alerte ─────────────────────────────────
  console.log("Seuils d'alerte...");
  await prisma.seuilAlerte.createMany({
    data: [
      { capteurType: "SpO2", ageMin: 15, ageMax: 120, valMin: 95, valMax: 100, unite: "%" },
      { capteurType: "FC", ageMin: 15, ageMax: 120, valMin: 60, valMax: 100, unite: "bpm" },
      { capteurType: "TA_SYS", ageMin: 15, ageMax: 120, valMin: 90, valMax: 140, unite: "mmHg" },
      { capteurType: "TA_DIA", ageMin: 15, ageMax: 120, valMin: 60, valMax: 90, unite: "mmHg" },
      { capteurType: "TEMP", ageMin: 0, ageMax: 120, valMin: 36, valMax: 37.5, unite: "°C" },
      { capteurType: "FR", ageMin: 15, ageMax: 120, valMin: 12, valMax: 20, unite: "/min" },
    ],
  });

  // ─── Dispositifs ─────────────────────────────────────
  console.log("Dispositifs...");
  await prisma.dispositif.createMany({
    data: [
      { type: "oxymetre", serial: "OXY-0001", zoneId: zones[0].id, statut: "connecte", dernierContact: new Date() },
      { type: "tensiometre", serial: "TEN-0001", zoneId: zones[0].id, statut: "connecte", dernierContact: new Date() },
      { type: "thermometre", serial: "THE-0001", zoneId: zones[1].id, statut: "deconnecte" },
      { type: "ecg", serial: "ECG-0001", zoneId: zones[2].id, statut: "connecte", dernierContact: new Date() },
    ],
  });

  // ─── Patients ────────────────────────────────────────
  console.log("Patients...");
  const prenomsM = ["Ibrahim", "Moussa", "Paul", "Daniel", "Samuel", "Joseph", "Pierre", "Andre"];
  const prenomsF = ["Aicha", "Mariam", "Grace", "Esther", "Rebecca", "Sarah", "Ruth", "Anne"];
  const noms = ["Bouba", "Aminou", "Fotso", "Nkemta", "Abena", "Manga", "Sali", "Hamadou", "Tabi", "Etoa"];
  const sexes = ["M", "F"];
  const patients = [];
  for (let i = 0; i < 25; i++) {
    const sexe = pick(sexes);
    const annee = pick([1945, 1958, 1962, 1975, 1980, 1988, 1995, 2001, 2010, 2018]);
    const patient = await prisma.patient.create({
      data: {
        nom: pick(noms),
        prenom: sexe === "M" ? pick(prenomsM) : pick(prenomsF),
        dateNaissance: new Date(`${annee}-0${1 + (i % 9)}-15`),
        sexe,
        poidsKg: rand(8, 90),
        zoneId: pick(zones).id,
        agentRefId: pick(agents.slice(0, 4)).id,
        antecedents: { allergies: pick([[], ["penicilline"], ["arachides"]]), pathologies: pick([[], ["paludisme"], ["hypertension"], ["asthme"]]) },
      },
    });
    patients.push(patient);
  }

  // ─── Sessions de triage + mesures (30 jours d'historique) ─
  console.log("Sessions + mesures...");
  const symptomesPool = ["fievre", "toux", "fatigue", "maux_de_tete", "douleur_thoracique", "vomissements", "diarrhee", "essoufflement"];
  const niveaux = ["VERT", "VERT", "VERT", "ORANGE", "ORANGE", "ROUGE"];

  let mesureCount = 0;
  for (let i = 0; i < 40; i++) {
    const patient = pick(patients);
    const agent = pick(agents.slice(0, 4));
    const niveau = pick(niveaux);
    const daysAgo = Math.floor(Math.random() * 30);
    const debut = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 3600000 * 5);
    const fin = new Date(debut.getTime() + (5 + Math.random() * 20) * 60000);

    const session = await prisma.sessionTriage.create({
      data: {
        patientId: patient.id,
        agentId: agent.id,
        debut,
        fin,
        statut: "complete",
        symptomes: [pick(symptomesPool), pick(symptomesPool)],
        dureeSymptomes: pick(["<1h", "1-6h", "6-24h", ">24h"]),
        niveauTriage: niveau,
        scoreIa: rand(0.7, 0.99),
        recommandation: niveau === "ROUGE" ? "Evacuation immediate" : niveau === "ORANGE" ? "Prise en charge sous 30 min" : "Surveillance de routine",
        signesCritiques: niveau === "VERT" ? [] : ["anomalie detectee"],
      },
    });

    // Constantes selon le niveau.
    const ranges =
      niveau === "ROUGE"
        ? { SpO2: [82, 89], FC: [130, 160], TA_SYS: [70, 88], TA_DIA: [45, 60], TEMP: [38, 41], FR: [26, 34] }
        : niveau === "ORANGE"
        ? { SpO2: [90, 94], FC: [101, 125], TA_SYS: [145, 175], TA_DIA: [90, 105], TEMP: [38, 39.5], FR: [21, 26] }
        : { SpO2: [96, 99], FC: [62, 95], TA_SYS: [105, 135], TA_DIA: [65, 85], TEMP: [36.4, 37.4], FR: [13, 19] };

    // Serie temporelle de ~30 mesures par session.
    for (let t = 0; t < 30; t++) {
      const ts = new Date(debut.getTime() + t * 30000);
      for (const [type, [min, max]] of Object.entries(ranges)) {
        await prisma.mesure.create({
          data: {
            sessionId: session.id,
            patientId: patient.id,
            capteurType: type,
            valeur: rand(min, max),
            unite: UNITES[type],
            horsNorme: niveau !== "VERT",
            source: "simulation",
            timestamp: ts,
          },
        });
        mesureCount++;
      }
    }

    // Alertes pour ORANGE/ROUGE (12 au total : melange resolues/actives).
    if (niveau !== "VERT" && i < 12) {
      const resolue = i % 3 !== 0; // ~2/3 resolues
      await prisma.alerte.create({
        data: {
          sessionId: session.id,
          patientId: patient.id,
          agentId: agent.id,
          niveau,
          typeAlerte: niveau === "ROUGE" ? "SpO2_CRITIQUE" : "FIEVRE_ELEVEE",
          valeurCritique: { mesure: "SpO2", valeur: ranges.SpO2[0], seuil: 95 },
          statut: resolue ? "resolue" : "active",
          priseEnChargePar: resolue ? spec1.id : null,
          priseEnChargeAt: resolue ? new Date(debut.getTime() + 120000) : null,
          resolueAt: resolue ? new Date(debut.getTime() + 600000) : null,
          notesResolution: resolue ? "Patient stabilise apres teleconsultation et traitement." : null,
          createdAt: debut,
        },
      });
    }
  }

  // ─── Consultations video ─────────────────────────────
  console.log("Consultations...");
  const alertesResolues = await prisma.alerte.findMany({ where: { statut: "resolue" }, take: 6 });
  for (const a of alertesResolues) {
    await prisma.consultationVideo.create({
      data: {
        sessionId: a.sessionId,
        alerteId: a.id,
        agentId: a.agentId,
        specialisteId: a.priseEnChargePar || spec1.id,
        debut: a.createdAt,
        fin: new Date(a.createdAt.getTime() + 480000),
        dureeSecondes: 480,
        statut: "terminee",
        roomId: `room-seed-${a.id.slice(0, 6)}`,
        notesCliniques: "Patient examine en video. Constantes verifiees.",
        diagnostic: pick(["Detresse respiratoire", "Crise hypertensive", "Paludisme severe", "Deshydratation"]),
        recommandations: "Traitement administre, surveillance 24h, reevaluation demain.",
      },
    });
  }

  console.log("\nSeed termine :");
  console.log(`  Zones        : ${zones.length}`);
  console.log(`  Agents       : ${agents.length}`);
  console.log(`  Patients     : ${patients.length}`);
  console.log(`  Sessions     : 40`);
  console.log(`  Mesures      : ${mesureCount}`);
  console.log(`  Consultations: ${alertesResolues.length}`);
  console.log("\nComptes de demo :");
  console.log("  CM-001 / Demo2026!   (agent)");
  console.log("  spec@healthmesh.org / Demo2026!  (specialiste)");
  console.log("  admin@healthmesh.org / Admin2026!  (admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
