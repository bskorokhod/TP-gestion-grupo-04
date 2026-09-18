import { useState } from "react";

const historyIcon = "/clockhistory.png";
import {
  Button,
  Navbar,
  SectionTabs,
  SectionBanner,
  DebtCard,
  OwedCard,
  ProposalCard,
  PersonRow,
} from "./components.jsx";

export function GroupScreen() {
  const [personView, setPersonView] = useState(false);

  return (
    <main className="min-h-screen bg-surface font-poppins text-foreground">
      <Navbar />
      <SectionTabs historyIcon={historyIcon} />

      <section className="rounded-b-3xl bg-primary px-5 py-8 text-on-color sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="text-sm text-tint">Bienvenida otra vez,</p>
            <h1 className="mt-1 text-4xl font-black sm:text-5xl">Casa Madryn</h1>
            <p className="mt-2 text-sm text-tint">Gastos compartidos del grupo y tu saldo actual.</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-primary/20 rounded-full bg-card px-6 py-4 text-foreground shadow-soft sm:px-8">
            <div className="pr-5"><strong className="block text-xl font-black text-danger sm:text-2xl">$11.500</strong><span className="text-xs font-medium uppercase text-primary">Debés</span></div>
            <div className="px-5"><strong className="block text-xl font-black text-success sm:text-2xl">$25.000</strong><span className="text-xs font-medium uppercase text-primary">Te deben</span></div>
            <div className="pl-5"><strong className="block text-xl font-black text-primary sm:text-2xl">2</strong><span className="text-xs font-medium uppercase text-primary">Gastos propuestos</span></div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl justify-end px-5 sm:px-8 lg:px-12">
        <button onClick={() => setPersonView((value) => !value)} className="flex items-center gap-3 rounded-b-3xl bg-primary px-6 py-3 text-xs text-on-color" aria-pressed={personView}>
          Vista por gasto
          <span className={`flex h-6 w-12 items-center rounded-full bg-card p-1 ${personView ? "justify-end" : "justify-start"}`}><span className="size-4 rounded-full bg-success" /></span>
          <span className="hidden sm:inline">Vista por persona</span>
        </button>
      </div>

      <section className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-12">
        <div className="space-y-4">
          <SectionBanner title="Gastos que me deben" description="Estas son las deudas que otros tienen con vos. Revisá el estado del pago de cada uno y reclamá pagos cuando corresponda." tone="success" action="Agregar gasto" />
          <div className="grid gap-4 lg:grid-cols-2">
            <DebtCard title="Compra de heladera" amount="Total: $60.000 - Individual: $15.000" description="Reemplazo de heladera rota en la cocina">
              <PersonRow name="Lucia" />
              <PersonRow name="Pablo" paid claim />
              <PersonRow name="Diego" paid claim />
            </DebtCard>
            <DebtCard title="Fumigación" amount="Total: $15.000 - Individual: $5.000" description="Control de plagas trimestral">
              <PersonRow name="Rocio" />
              <PersonRow name="Pablo" />
            </DebtCard>
          </div>
        </div>

        <div className="space-y-4">
          <SectionBanner title="Gastos que debo" description="Estas son las deudas que tenés con otras personas." tone="danger" />
          <div className="grid gap-4 lg:grid-cols-2">
            <OwedCard title="Subscripción a Netflix" amount="Total: $9.000 - Individual: $4.500" description="Membresía mensual de la plataforma de streaming de video" assigned={["Yo"]} owner="Rocio" tag="Mensual" />
            <OwedCard title="Arreglo de reja" amount="Total: $21.000 - Individual: $7.000" description="Soldadura de la reja del frente" assigned={["Diego", "Yo"]} owner="Pablo" tag="Único" />
          </div>
        </div>
      </section>

      <section aria-label="Gastos propuestos">
        <svg
          className="block h-16 w-full fill-proposal-soft"
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,0 Q720,128 1440,0 L1440,64 L0,64 Z" />
        </svg>
        <div className="rounded-b-3xl bg-proposal-soft px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-on-color">
              <div className="min-w-0"><h2 className="text-xl font-bold">Gastos propuestos</h2><p className="text-xs">Pendientes de aprobación</p></div>
              <Button tone="proposal" className="shrink-0">Proponer gasto</Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ProposalCard title="Poda de árboles" amount="Total: $18.000 - Individual: $6.000" description="Mantenimiento anual del jardín" assigned={["Rocio", "Yo"]} owner="Lucia" />
              <ProposalCard title="Reparación de techo" amount="Total: $44.000 - Individual: $11.000" description="Filtración detectada en el dormitorio principal" assigned={["Rocio", "Pablo", "Lucia"]} owner="Yo" accepted />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
