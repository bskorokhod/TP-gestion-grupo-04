import type {ReactNode} from "react";

import Button from "@/components/Button.tsx";

const people = {
    Lucia: { label: "L", tone: "bg-custom-red" },
    Pablo: { label: "P", tone: "bg-custom-orange" },
    Diego: { label: "D", tone: "bg-custom-lilac" },
    Rocio: { label: "R", tone: "bg-custom-green" },
    Yo: { label: "Yo", tone: "bg-custom-me" },
} as const;

export type PersonName = keyof typeof people;

export interface AvatarProps {
    name: PersonName;
}

export function Avatar({ name }: AvatarProps) {
    const person = people[name];
    return (
        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold text-brand-foreground ${person.tone}`}>
      {person.label}
    </span>
    );
}

export interface PersonRowProps {
    name: PersonName;
    paid?: boolean;
    claim?: boolean;
}

export function PersonRow({ name, paid = false, claim = false }: PersonRowProps) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <Avatar name={name} />
                <span className="truncate text-sm font-medium">{name === "Rocio" ? "Rocío" : name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${paid ? "bg-group-green/70 text-brand-foreground" : "bg-field/70 text-group-muted"}`}>
          {paid ? "Pagó" : "No pagó"}
        </span>
                {claim && <Button variant="danger" className="hidden sm:block">Reclamar pago</Button>}
            </div>
        </div>
    );
}

export interface AmountTitleProps {
    title: string;
    amount: string;
    tag?: string;
}

export function AmountTitle({ title, amount, tag }: AmountTitleProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium">
            <h3>{title}</h3>
            <span className="text-brand">{amount}</span>
            {tag && <span className="rounded-full bg-group-paper px-3 py-1 text-sm text-brand">{tag}</span>}
        </div>
    );
}

export interface PeopleMetaProps {
    assigned: PersonName[];
    owner: PersonName;
}

export function PeopleMeta({ assigned, owner }: PeopleMetaProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 text-sm text-group-muted">
            <div className="flex items-center gap-1.5">
                <span>Asignado a:</span>
                <span className="flex -space-x-1">{assigned.map((name) => <Avatar key={name} name={name} />)}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span>A cargo de:</span>
                <Avatar name={owner} />
            </div>
        </div>
    );
}

export interface ExpenseCardProps {
    children: ReactNode;
    className?: string;
}

export function ExpenseCard({ children, className = "" }: ExpenseCardProps) {
    return <article className={`rounded-xl border border-brand/50 bg-panel p-5 ${className}`}>{children}</article>;
}

export interface DebtCardProps {
    title: string;
    amount: string;
    description: string;
    children: ReactNode;
}

export function DebtCard({ title, amount, description, children }: DebtCardProps) {
    return (
        <ExpenseCard>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <AmountTitle title={title} amount={amount} tag={undefined} />
                <button className="text-sm font-medium text-brand" aria-label={`Ver pagos de ${title}`}>2 de 3 pagaron⌄</button>
            </div>
            <p className="mt-3 text-sm text-group-muted">{description}</p>
            <div className="mt-3 space-y-2">{children}</div>
        </ExpenseCard>
    );
}

export interface OwedCardProps {
    title: string;
    amount: string;
    description: string;
    assigned: PersonName[];
    owner: PersonName;
    tag?: string;
}

export function OwedCard({ title, amount, description, assigned, owner, tag }: OwedCardProps) {
    return (
        <ExpenseCard className="flex min-h-48 flex-col justify-between">
            <div className="space-y-2">
                <AmountTitle title={title} amount={amount} tag={tag} />
                <p className="text-sm text-group-muted">{description}</p>
                <PeopleMeta assigned={assigned} owner={owner} />
            </div>
            <div className="mt-4 flex justify-end"><Button variant="success" className={undefined}>Marcar como pagado</Button></div>
        </ExpenseCard>
    );
}

export interface ProposalCardProps {
    title: string;
    amount: string;
    description: string;
    assigned: PersonName[];
    owner: PersonName;
    accepted?: boolean;
}

export function ProposalCard({ title, amount, description, assigned, owner, accepted = false }: ProposalCardProps) {
    return (
        <ExpenseCard className="border-group-amber">
            <div className="space-y-2">
                <AmountTitle title={title} amount={amount} tag={undefined}/>
                <p className="text-sm text-group-muted">{description}</p>
                <PeopleMeta assigned={assigned} owner={owner}/>
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <button className="truncate text-left text-sm font-medium text-brand">Ver votos
                    ({accepted ? "3 de 4" : "1 de 3"} votaron)⌄
                </button>
                <div className="flex shrink-0 gap-2">
                    <Button variant={accepted ? "muted" : "success"}
                            className={undefined}>{accepted ? "Aceptado" : "Aceptar"}</Button>
                    <Button variant={accepted ? "muted" : "danger"}
                            className={undefined}>{accepted ? "Cancelar" : "Rechazar"}</Button>
                </div>
            </div>
        </ExpenseCard>
    );
}
