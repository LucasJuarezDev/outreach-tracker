import { addDays } from "./dates";
import type { Outcome, Outreach } from "./types";

/**
 * Generates a believable, fully fictional campaign for the public demo.
 * Domains use the reserved ".example" TLD; dates are relative to `now`
 * so the demo always looks current. Same seed → same data.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PREFIXES = [
  "Austral", "Pampa Sur", "Delta Norte", "Litoral", "Cumbre", "Atlántica", "Ombú", "Río Claro",
  "Llanura", "Horizonte", "Mar Austral", "Tierra Fértil", "Sierra Alta", "Puerto Nuevo", "Viento Sur",
  "Campo Abierto", "Cruz del Sur", "Bahía Clara", "Altiplano", "Ceibo", "Quebracho", "Tres Arroyos",
  "Laguna Azul", "Paraná Bravo", "Monte Verde", "Las Toscas", "Nogal", "Calden", "Tala", "Algarrobo",
];
const SUFFIX_BY_SEGMENT: Record<string, string[]> = {
  Beef: ["Meats", "Carnes", "Beef Trading"],
  Poultry: ["Poultry", "Avícola", "Protein"],
  Seafood: ["Seafood", "Pesquera", "Frozen Fish"],
  "Peanuts & pulses": ["Agro", "Granos", "Commodities"],
  "Fruit & other": ["Foods", "Export", "Alimentos"],
};
const SEGMENTS = Object.keys(SUFFIX_BY_SEGMENT);

const LOCATIONS: Array<{ ring: number; places: string[] }> = [
  { ring: 1, places: ["San Fernando", "Tigre", "San Isidro", "Vicente López", "Escobar", "Pilar"] },
  { ring: 2, places: ["CABA", "Avellaneda", "Quilmes", "La Matanza"] },
  { ring: 3, places: ["Mar del Plata", "Bahía Blanca", "Zárate", "Campana"] },
  { ring: 4, places: ["Rosario", "Córdoba", "Paraná", "Santa Fe"] },
  { ring: 5, places: ["Puerto Madryn", "Mendoza", "Tucumán", "Salta"] },
];

const FIRST = ["Ana", "Martín", "Carolina", "Diego", "Lucía", "Pablo", "Sofía", "Javier", "Valeria", "Nicolás", "Florencia", "Gustavo", "Paula", "Matías", "Romina", "Federico"];
const LAST = ["Gómez", "Fernández", "Rossi", "Díaz", "Romero", "Sosa", "Álvarez", "Torres", "Ruiz", "Benítez", "Acosta", "Medina", "Herrera", "Castro", "Molina", "Ortiz"];
const ROLES = ["Socio gerente", "Gerente de comercio exterior", "Director", "Jefe de logística", "Gerente de administración"];

const SUBJECT_BY_SEGMENT: Record<string, string> = {
  Beef: "software para exportadores de carne",
  Poultry: "sistema para traders de pollo congelado",
  Seafood: "sistema para exportadores de pescado congelado",
  "Peanuts & pulses": "software para exportadores de maní",
  "Fruit & other": "software para exportadores de alimentos",
};

const REPLIES: Record<Exclude<Outcome, "PENDING">, string[]> = {
  INTERESTED: ["Hola Lucas, sí, mandame el video. Justo estamos buscando ordenar los embarques.", "Interesante. ¿Podemos verlo la semana que viene?"],
  MORE_INFO: ["¿Se integra con nuestro sistema contable? ¿Qué costo tiene?", "Gracias, ¿tienen algún material para pasarle al socio?"],
  LATER: ["Ahora estamos en plena temporada, escribime en marzo.", "Lo vemos después del cierre del trimestre."],
  NOT_INTERESTED: ["Gracias, pero ya trabajamos con otro sistema.", "No es algo que estemos buscando ahora, saludos."],
  UNSUBSCRIBED: ["Por favor no me escriban más.", "Remove me from your list, thanks."],
};
const UNREVIEWED = ["Hola, ¿cómo funciona el tema de los permisos por usuario?", "Mandame el video así lo veo con el equipo."];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function generateDemoOutreaches(now: Date, seed = 42): Outreach[] {
  const rand = mulberry32(seed);
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;
  const hour = (d: Date, h: number) => {
    const copy = new Date(d);
    copy.setUTCHours(h, Math.floor(rand() * 60), 0, 0);
    return copy;
  };

  const items: Outreach[] = [];
  const usedNames = new Set<string>();
  // ~12 weeks of weekdays, 3–5 emails per day, the campaign started small and ramped up.
  for (let daysAgo = 83; daysAgo >= 0; daysAgo -= 1) {
    const day = addDays(now, -daysAgo);
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const perDay = daysAgo > 56 ? 2 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3);
    // Prospecting moves outward over time, one ring at a time.
    const maxRing = Math.min(5, 1 + Math.floor((83 - daysAgo) / 17));

    for (let k = 0; k < perDay; k += 1) {
      const ringEntry = LOCATIONS[Math.min(maxRing, Math.max(1, maxRing - Math.floor(rand() * 2))) - 1]!;
      const segment = pick(SEGMENTS);
      let name = `${pick(PREFIXES)} ${pick(SUFFIX_BY_SEGMENT[segment]!)}`;
      while (usedNames.has(name)) name = `${pick(PREFIXES)} ${pick(SUFFIX_BY_SEGMENT[segment]!)}`;
      usedNames.add(name);
      const domain = `${slug(name)}.example`;
      const first = pick(FIRST);
      const last = pick(LAST);
      const sentAt = hour(day, 12 + Math.floor(rand() * 4));
      const age = (now.getTime() - sentAt.getTime()) / 86_400_000;
      const id = `demo-${items.length + 1}`;

      const o: Outreach = {
        id,
        gmailThreadId: id,
        subject: SUBJECT_BY_SEGMENT[segment]!,
        sentAt,
        followUpSentAt: null,
        firstReplyAt: null,
        lastReplyAt: null,
        replyCount: 0,
        autoReplyCount: rand() < 0.07 ? 1 : 0,
        lastReplySnippet: null,
        bounced: rand() < 0.04,
        outcome: "PENDING",
        notes: null,
        contact: {
          id: `${id}-contact`,
          email: `${slug(first)}.${slug(last)}@${domain}`,
          name: `${first} ${last}`,
          role: pick(ROLES),
        },
        company: {
          id: `${id}-company`,
          name,
          domain,
          website: `https://${domain}`,
          location: pick(ringEntry.places),
          ring: ringEntry.ring,
          segment,
          notes: null,
        },
      };

      if (!o.bounced) {
        const repliesBeforeFollowUp = rand() < 0.07;
        const replyAfterFollowUp = !repliesBeforeFollowUp && rand() < 0.06;
        // Old threads almost always got their follow-up; the last few days still have some pending.
        const followedUp = !repliesBeforeFollowUp && age > 7.5 && (age > 10 || rand() < 0.4);
        if (followedUp) o.followUpSentAt = hour(addDays(sentAt, 7), 13);

        const replyDelay = repliesBeforeFollowUp ? 1 + rand() * 4 : 8 + rand() * 4;
        if ((repliesBeforeFollowUp || (replyAfterFollowUp && followedUp)) && age > replyDelay) {
          const repliedAt = new Date(sentAt.getTime() + replyDelay * 86_400_000);
          o.replyCount = 1;
          o.firstReplyAt = repliedAt;
          o.lastReplyAt = repliedAt;
          // Recent replies are still waiting for the user to classify them.
          if (now.getTime() - repliedAt.getTime() < 3 * 86_400_000) {
            o.lastReplySnippet = pick(UNREVIEWED);
          } else {
            const r = rand();
            const outcome: Exclude<Outcome, "PENDING"> =
              r < 0.3 ? "INTERESTED" : r < 0.5 ? "MORE_INFO" : r < 0.65 ? "LATER" : r < 0.93 ? "NOT_INTERESTED" : "UNSUBSCRIBED";
            o.outcome = outcome;
            o.lastReplySnippet = pick(REPLIES[outcome]);
          }
        }
      }
      items.push(o);
    }
  }
  return items.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
}
