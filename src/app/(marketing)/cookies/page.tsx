import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";

const cookies = [
  {
    name: "sb-*-auth-token",
    purpose: "Session d'authentification (Supabase). Déposé uniquement si vous vous connectez — par exemple à l'espace d'administration. Un visiteur anonyme du site vitrine n'en reçoit aucun.",
    duration: "Jusqu'à expiration de la session",
    type: "Strictement nécessaire",
  },
];

const localStorageItems = [
  { name: "mystreet:cookies", purpose: "Mémorise votre choix (accepter/refuser) sur ce bandeau." },
  { name: "mystreet:theme", purpose: "Mémorise si vous préférez l'affichage clair ou sombre." },
];

export default function CookiesPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow">
          <Eyebrow>Légal</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Politique{" "}
            <span className="font-serif italic text-primary">cookies.</span>
          </h1>
          <p className="mt-4 text-caption text-n-500">
            Dernière mise à jour : 15 mars 2026
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow">
          <div className="prose prose-lg max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
            <h2>Que sont les cookies</h2>
            <p>
              Les cookies sont de petits fichiers texte déposés sur votre
              appareil quand vous visitez un site web. Ils permettent
              notamment à MyStreet de vous identifier, mémoriser vos
              préférences et mesurer l'usage du service.
            </p>
            <p>
              À ce jour, MyStreet ne dépose aucun cookie de mesure
              d'audience ni de publicité — le site n'utilise aucun outil
              d'analytics ni de tracking. Le seul cookie possible est celui,
              strictement nécessaire, de l'authentification.
            </p>

            <h2>Cookies que nous utilisons</h2>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-n-100 bg-surface">
            <table className="w-full text-left">
              <thead className="border-b border-n-100 bg-n-50">
                <tr>
                  <th className="px-5 py-3 text-label uppercase tracking-[0.12em] text-n-500">Nom</th>
                  <th className="px-5 py-3 text-label uppercase tracking-[0.12em] text-n-500">Finalité</th>
                  <th className="px-5 py-3 text-label uppercase tracking-[0.12em] text-n-500">Durée</th>
                  <th className="px-5 py-3 text-label uppercase tracking-[0.12em] text-n-500">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-n-100">
                {cookies.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-3 font-mono text-body-sm text-primary-ink">{c.name}</td>
                    <td className="px-5 py-3 text-body-sm text-n-700">{c.purpose}</td>
                    <td className="px-5 py-3 text-body-sm text-n-700">{c.duration}</td>
                    <td className="px-5 py-3 text-body-sm text-n-500">{c.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="prose prose-lg mt-10 max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
            <h2>Stockage local (localStorage)</h2>
            <p>
              En plus du cookie ci-dessus, votre navigateur conserve
              localement quelques préférences — techniquement pas des
              cookies (ils ne sont jamais envoyés au serveur), mais on les
              liste ici par souci de transparence complète.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-n-100 bg-surface">
            <table className="w-full text-left">
              <thead className="border-b border-n-100 bg-n-50">
                <tr>
                  <th className="px-5 py-3 text-label uppercase tracking-[0.12em] text-n-500">Clé</th>
                  <th className="px-5 py-3 text-label uppercase tracking-[0.12em] text-n-500">Finalité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-n-100">
                {localStorageItems.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-3 font-mono text-body-sm text-primary-ink">{c.name}</td>
                    <td className="px-5 py-3 text-body-sm text-n-700">{c.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="prose prose-lg mt-10 max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
            <h2>Vos préférences</h2>
            <p>
              Le bandeau de consentement n'apparaît qu'une fois : votre choix
              (accepter/refuser) est mémorisé localement. Pour le revoir,
              effacez les données de site pour mystreet.fr dans les
              paramètres de votre navigateur — le bandeau réapparaîtra à
              votre prochaine visite. Le cookie d'authentification, lui,
              n'est de toute façon pas soumis à consentement : il est
              strictement nécessaire au fonctionnement du service (vous
              maintenir connecté) et ne sert à rien d'autre.
            </p>

            <h2>Cookies tiers</h2>
            <p>
              MyStreet n'utilise aucun cookie publicitaire ni aucun outil de
              mesure d'audience tiers (pas de Google Analytics, pas de
              Plausible, pas d'équivalent) à ce jour. Cette page sera mise à
              jour si cela change.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
