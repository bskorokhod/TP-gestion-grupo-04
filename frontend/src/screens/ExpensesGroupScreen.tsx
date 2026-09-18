import { useState } from "react";

import Button from "@/components/Button.tsx"

import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {SectionBanner} from "@/components/SectionBanner.tsx";
import {DebtCard, OwedCard, PersonRow, ProposalCard} from "@/components/ExpensesCard.tsx";
import Footer from "@/components/Footer.tsx";

export const ExpensesGroupScreen = () => {
  const [personView, setPersonView] = useState(false);

  return (
      <CommonLayout className="min-h-screen bg-background font-poppins text-foreground">
        <GroupNavbar/>

        <div className="mx-auto flex justify-end">
          <button onClick={() => setPersonView((value) => !value)} className="flex items-center gap-3 rounded-b-3xl bg-brand px-6 py-3 text-base text-brand-foreground" aria-pressed={personView}>
            Vista por gasto
            <span className={`flex h-6 w-12 items-center rounded-full bg-panel p-1 ${personView ? "justify-end" : "justify-start"}`}><span className="size-4 rounded-full bg-group-green" /></span>
            <span className="hidden sm:inline">Vista por persona</span>
          </button>
        </div>

        <section className="mx-auto space-y-8 px-5 py-8 sm:px-8 lg:px-30">
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
            <SectionBanner title="Gastos que debo" description="Estas son las deudas que tenés con otras personas."
                           tone="danger" action={undefined} />
            <div className="grid gap-4 lg:grid-cols-2">
              <OwedCard title="Subscripción a Netflix" amount="Total: $9.000 - Individual: $4.500" description="Membresía mensual de la plataforma de streaming de video" assigned={["Yo"]} owner="Rocio" tag="Mensual" />
              <OwedCard title="Arreglo de reja" amount="Total: $21.000 - Individual: $7.000" description="Soldadura de la reja del frente" assigned={["Diego", "Yo"]} owner="Pablo" tag="Único" />
            </div>
          </div>
        </section>

        <section aria-label="Gastos propuestos">
          <div className="bg-amber-soft  h-16">
            <div className="bg-background h-16 rounded-b-full"></div>
          </div>

          <div className="bg-group-amber-soft px-5 py-10 sm:px-8 lg:px-30">
            <div className="mx-auto space-y-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-brand-foreground">
                <div className="min-w-0"><h2 className="text-xl font-bold">Gastos propuestos</h2><p className="text-base">Pendientes de aprobación</p></div>
                <Button variant="proposal" className="shrink-0 text-lg p-6">Proponer gasto</Button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ProposalCard title="Poda de árboles" amount="Total: $18.000 - Individual: $6.000" description="Mantenimiento anual del jardín" assigned={["Rocio", "Yo"]} owner="Lucia" />
                <ProposalCard title="Reparación de techo" amount="Total: $44.000 - Individual: $11.000" description="Filtración detectada en el dormitorio principal" assigned={["Rocio", "Pablo", "Lucia"]} owner="Yo" accepted />
              </div>
            </div>
          </div>
        </section>
        <Footer/>
      </CommonLayout>
  );
}