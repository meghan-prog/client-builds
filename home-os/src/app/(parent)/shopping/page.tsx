import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getShoppingList } from "@/lib/data/shopping-tasks";
import { addShoppingItemAction, toggleShoppingItemAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const familyId = await getPrimaryFamilyId();
  const items = await getShoppingList(familyId);
  const pending = items.filter((i) => i.status === "pending");
  const bought = items.filter((i) => i.status === "bought");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-sm font-medium text-ink-faint">Huishouden</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Boodschappenlijst</h1>

      <form
        action={async (formData: FormData) => {
          "use server";
          await addShoppingItemAction(String(formData.get("name") ?? ""));
        }}
        className="mb-6 flex gap-2"
      >
        <input
          name="name"
          placeholder="Item toevoegen…"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          Toevoegen
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {pending.map((item) => (
          <form key={item.id} action={toggleShoppingItemAction.bind(null, item.id)}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:bg-surface-muted">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink-faint" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                {item.reason && <p className="text-xs text-ink-faint">{item.reason}</p>}
              </div>
              {item.neededByDate && (
                <span className="shrink-0 text-xs text-ink-faint">
                  vóór {format(item.neededByDate, "EEEE", { locale: nl })}
                </span>
              )}
            </button>
          </form>
        ))}
        {pending.length === 0 && <p className="text-sm text-ink-faint">Niets nodig — je lijst is leeg.</p>}
      </div>

      {bought.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Gekocht</h2>
          <div className="flex flex-col gap-2">
            {bought.map((item) => (
              <form key={item.id} action={toggleShoppingItemAction.bind(null, item.id)}>
                <button type="submit" className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-muted p-3 text-left opacity-70">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs text-white">✓</span>
                  <p className="flex-1 text-sm text-ink-soft line-through">{item.name}</p>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
