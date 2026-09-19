import { SectionBanner } from "@/components/Expenses/SectionBanner.tsx";
import { PersonBalanceCard } from "@/components/Expenses/ExpensesCard.tsx";
import type { PersonBalanceCardProps } from "@/components/Expenses/ExpensesCard.tsx";


const people: PersonBalanceCardProps[] = [
    {
        name: "Rocio",
        balance: "Te debe $5.000",
        balanceStatus: "positive",
        items: [{ name: "Fumigación", amount: "$5.000", variant: "credit", action: "readonly" }]
    },
    {
        name: "Lucia",
        balance: "Te debe $15.000",
        balanceStatus: "positive",
        items: [{ name: "Compra de heladera", amount: "$15.000", variant: "credit", action: "readonly" }]
    },
    {
        name: "Pablo",
        balance: "Le debés $2.000",
        balanceStatus: "negative",
        items: [
            { name: "Fumigación", amount: "$5.000", variant: "credit", action: "readonly" },
            { name: "Arreglo de reja", amount: "$7.000", variant: "debt", action: "payable" }
        ]
    },
    {
        name: "Diego",
        balance: "Sin deudas pendientes",
        balanceStatus: "neutral",
        items: []
    }
];

export const PerPersonView = () => {
    return (
        <section className="mx-auto space-y-8 px-5 py-8 sm:px-8 lg:px-30">
            <SectionBanner
                title="Gastos por persona"
                description="Estas son las deudas que tienen con vos y las que tenés con el resto de los miembros del grupo."
                variant="allDebt"
                action="Agregar gasto"
            />

            <div className="grid gap-4 lg:grid-cols-2 items-start">
                {people.map((person) => (
                    <PersonBalanceCard key={person.name} {...person} />
            ))}
        </div>
        </section>
    );
}