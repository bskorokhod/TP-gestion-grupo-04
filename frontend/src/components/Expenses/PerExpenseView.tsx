import {SectionBanner} from "@/components/Expenses/SectionBanner.tsx";
import {DebtCard, OwedCard, PersonRow} from "@/components/Expenses/ExpensesCard.tsx";

export const PerExpenseView = () => {
    return (
    <section className="mx-auto space-y-8 px-5 py-8 sm:px-8 lg:px-30">
        <div className="space-y-4">
            <SectionBanner title="Gastos que me deben" description="Estas son las deudas que otros tienen con vos. Revisá el estado del pago de cada uno y reclamá pagos cuando corresponda."
                           variant="othersDebt" action="Agregar gasto" />
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
                           variant="ownDebt" action={undefined} />
            <div className="grid gap-4 lg:grid-cols-2">
                <OwedCard title="Subscripción a Netflix" amount="Total: $9.000 - Individual: $4.500" description="Membresía mensual de la plataforma de streaming de video" assigned={["Yo"]} owner="Rocio" tag="Mensual" />
                <OwedCard title="Arreglo de reja" amount="Total: $21.000 - Individual: $7.000" description="Soldadura de la reja del frente" assigned={["Diego", "Yo"]} owner="Pablo" tag="Único" />
            </div>
        </div>
    </section>
    )
}