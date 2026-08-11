import { getStats, isDbConfigured } from "@/lib/db";
import { routes } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isDbConfigured();
  const stats = configured ? await getStats() : null;

  return (
    <main className="min-h-screen bg-pearl px-6 py-14">
      <div className="max-w-content mx-auto">
        <p className="label text-chestnut text-xs mb-2">AI Income Scan</p>
        <h1 className="text-3xl md:text-4xl text-mahogany mb-10">Admin — Statistieken</h1>

        {!configured && (
          <div className="bg-white border border-mahogany/10 rounded-3xl p-8 md:p-10">
            <p>
              Supabase is nog niet geconfigureerd. Zet <code>NEXT_PUBLIC_SUPABASE_URL</code> en{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> in je environment variables om statistieken
              te zien.
            </p>
          </div>
        )}

        {configured && !stats && (
          <div className="bg-white border border-mahogany/10 rounded-3xl p-8 md:p-10">
            <p>Statistieken konden niet worden opgehaald. Controleer de database-verbinding.</p>
          </div>
        )}

        {stats && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Scans gestart" value={stats.scansStarted} />
              <StatCard label="Scans afgerond" value={stats.scansCompleted} />
              <StatCard label="Leads" value={stats.leads} />
              <StatCard label="Academy CTA clicks" value={stats.academyClicks} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Conversie scan → lead"
                value={`${stats.conversionScanToLead}%`}
              />
              <StatCard
                label="Conversie scan → Academy CTA"
                value={`${stats.conversionScanToAcademy}%`}
              />
            </div>

            <div className="bg-white border border-mahogany/10 rounded-3xl p-8 md:p-10">
              <h2 className="text-xl text-mahogany mb-6">Resultaten per route</h2>
              <div className="space-y-4">
                {[...stats.routeDistribution]
                  .sort((a, b) => b.count - a.count)
                  .map((entry) => (
                    <div key={entry.route}>
                      <div className="flex justify-between mb-1.5 text-sm">
                        <span>{routes[entry.route].name}</span>
                        <span className="label text-chestnut">
                          {entry.percentage}% · {entry.count}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-mahogany/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-chestnut rounded-full"
                          style={{ width: `${entry.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-mahogany/10 rounded-2xl p-6">
      <p className="label text-mahogany/50 text-xs mb-2">{label}</p>
      <p className="text-3xl font-heading text-mahogany">{value}</p>
    </div>
  );
}
