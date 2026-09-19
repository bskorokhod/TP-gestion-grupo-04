import type { ReactNode } from "react";
import Button from "@/components/Button.tsx";

export const PEOPLE_CONFIG = {
    Lucia: { label: "L", tone: "bg-custom-red", displayName: "Lucía" },
    Pablo: { label: "P", tone: "bg-custom-orange", displayName: "Pablo" },
    Diego: { label: "D", tone: "bg-custom-lilac", displayName: "Diego" },
    Rocio: { label: "R", tone: "bg-custom-green", displayName: "Rocío" },
    Yo: { label: "Yo", tone: "bg-custom-me", displayName: "Yo" },
} as const;

export type PersonName = keyof typeof PEOPLE_CONFIG;

const PAYMENT_STATUS_CONFIG = {
    paid: { badgeClasses: "bg-group-green/70 text-brand-foreground", label: "Pagó" },
    unpaid: { badgeClasses: "bg-field/70 text-group-muted", label: "No pagó" },
} as const;

const BALANCE_COLORS = {
    positive: "text-group-green",
    negative: "text-group-danger",
    neutral: "text-group-muted",
} as const;

const TRANSACTION_VARIANTS = {
    debt: "text-group-danger",
    credit: "text-brand",
} as const;

const PROPOSAL_VARIANTS = {
    accepted: {
        votesLabel: "3 de 4",
        primaryBtn: { variant: "muted" as const, label: "Aceptado" },
        secondaryBtn: { variant: "muted" as const, label: "Cancelar" },
    },
    pending: {
        votesLabel: "1 de 3",
        primaryBtn: { variant: "success" as const, label: "Aceptar" },
        secondaryBtn: { variant: "danger" as const, label: "Rechazar" },
    },
} as const;

// --- COMPONENTES BASE ---

export interface AvatarProps {
    name: PersonName;
}

export function Avatar({ name }: AvatarProps) {
    const person = PEOPLE_CONFIG[name];
    return (
        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold text-brand-foreground ${person.tone}`}>
            {person.label}
        </span>
    );
}

export interface ExpenseCardProps {
    children: ReactNode;
    className?: string;
}

export function ExpenseCard({ children, className = "" }: ExpenseCardProps) {
    return <article className={`rounded-xl border border-brand/50 bg-panel p-5 ${className}`}>{children}</article>;
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

// --- TARJETAS DE USUARIO Y TRANSACCIONES ---

export interface PersonRowProps {
    name: PersonName;
    status?: keyof typeof PAYMENT_STATUS_CONFIG;
    action?: "claim" | "none";
}

export function PersonRow({ name, status = "unpaid", action = "none" }: PersonRowProps) {
    const config = PAYMENT_STATUS_CONFIG[status];
    const displayName = PEOPLE_CONFIG[name]?.displayName ?? name;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <Avatar name={name} />
                <span className="truncate text-sm font-medium">{displayName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${config.badgeClasses}`}>
                    {config.label}
                </span>
                {action === "claim" && <Button variant="danger" className="hidden sm:block">Reclamar pago</Button>}
            </div>
        </div>
    );
}

export interface TransactionRowProps {
    name: string;
    amount: string;
    variant?: keyof typeof TRANSACTION_VARIANTS;
    action?: "payable" | "readonly";
}

export function TransactionRow({ name, amount, variant = "credit", action = "readonly" }: TransactionRowProps) {
    const amountColor = TRANSACTION_VARIANTS[variant];

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">{name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <span className={`text-sm font-semibold ${amountColor}`}>
                    {amount}
                </span>
                {action === "payable" && (
                    <Button variant="success" className="hidden sm:block">Marcar como pagado</Button>
                )}
            </div>
        </div>
    );
}

export interface PersonBalanceCardProps {
    name: PersonName;
    balance: string;
    balanceStatus: keyof typeof BALANCE_COLORS;
    items: TransactionRowProps[];
}


export function PersonBalanceCard({ name, balance, balanceStatus, items }: PersonBalanceCardProps) {
    const displayName = PEOPLE_CONFIG[name]?.displayName ?? name;
    const balanceColor = BALANCE_COLORS[balanceStatus];

    return (
        <ExpenseCard className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar name={name} />
                    <h3 className="text-base font-semibold">{displayName}</h3>
                </div>
                <p className={`text-sm font-bold ${balanceColor}`}>
                    {balance}
                </p>
            </div>

            {items.length > 0 && (
                <div className="mt-4 space-y-2">
                    {items.map((item) => (
                        <TransactionRow key={`${name}-${item.name}`} {...item} />
                    ))}
                </div>
            )}
        </ExpenseCard>
    );
}

// --- TARJETAS GENERALES ---

export interface ProposalCardProps {
    title: string;
    amount: string;
    description: string;
    assigned: PersonName[];
    owner: PersonName;
    status?: keyof typeof PROPOSAL_VARIANTS;
}

export function ProposalCard({ title, amount, description, assigned, owner, status = "pending" }: ProposalCardProps) {
    const config = PROPOSAL_VARIANTS[status];

    return (
        <ExpenseCard className="border-group-amber">
            <div className="space-y-2">
                <AmountTitle title={title} amount={amount} />
                <p className="text-sm text-group-muted">{description}</p>
                <PeopleMeta assigned={assigned} owner={owner} />
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <button className="truncate text-left text-sm font-medium text-brand">
                    Ver votos ({config.votesLabel} votaron)⌄
                </button>
                <div className="flex shrink-0 gap-2">
                    <Button variant={config.primaryBtn.variant}>{config.primaryBtn.label}</Button>
                    <Button variant={config.secondaryBtn.variant}>{config.secondaryBtn.label}</Button>
                </div>
            </div>
        </ExpenseCard>
    );
}

// (Tus DebtCard y OwedCard se mantienen igual, usando el ExpenseCard base como ya hacían)