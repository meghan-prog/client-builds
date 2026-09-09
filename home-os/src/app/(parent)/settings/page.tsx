import { getPrimaryFamily } from "@/lib/data/family";
import { getWorkProfilesForFamily } from "@/lib/data/settings";
import { getOrCreateFamilyCalendar } from "@/lib/data/calendar-sync";
import { createWorkProfileAction, setDefaultWorkProfileAction } from "@/app/actions";
import CalendarFeedConnect from "@/components/CalendarFeedConnect";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default async function SettingsPage() {
  const family = await getPrimaryFamily();
  const parents = await getWorkProfilesForFamily(family.id);
  const calendar = await getOrCreateFamilyCalendar(family.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-sm font-medium text-ink-faint">Beheer</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Instellingen</h1>

      <section className="mb-8 card p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">Gezin</h2>
        <p className="text-sm text-ink">{family.name}</p>
      </section>

      <CalendarFeedConnect
        icsFeedUrl={calendar.icsFeedUrl}
        lastSyncedAt={calendar.lastSyncedAt ? calendar.lastSyncedAt.toISOString() : null}
      />

      {parents.map((parent) => (
        <section key={parent.id} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Werkprofielen — {parent.name}
          </h2>
          <div className="flex flex-col gap-3">
            {parent.workProfiles.map((profile) => (
              <div key={profile.id} className={`card p-4 ${profile.isDefault ? "ring-2 ring-accent" : ""}`}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{profile.name}</p>
                  {profile.isDefault ? (
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                      Actief
                    </span>
                  ) : (
                    <form action={setDefaultWorkProfileAction.bind(null, parent.id, profile.id)}>
                      <button type="submit" className="text-xs font-semibold text-ink-soft underline hover:text-ink">
                        Maak actief
                      </button>
                    </form>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.blocks.length === 0 && <span className="text-xs text-ink-faint">Geen werkblokken ingesteld.</span>}
                  {profile.blocks.map((b) => (
                    <span key={b.id} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-soft">
                      {b.dayOfWeek ? DAY_LABELS[b.dayOfWeek] : new Date(b.date!).toLocaleDateString("nl-NL")} {b.startTime}–{b.endTime}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form
            action={async (formData: FormData) => {
              "use server";
              await createWorkProfileAction(parent.id, String(formData.get("name") ?? ""));
            }}
            className="mt-3 flex gap-2"
          >
            <input
              name="name"
              placeholder="Nieuw werkprofiel, bijv. 'Launch week'"
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
            <button type="submit" className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-muted">
              Toevoegen
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
