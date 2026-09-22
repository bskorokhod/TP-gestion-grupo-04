import type { ReactNode } from "react";

import Button from "@/components/Button.tsx";
import { Avatar } from "@/components/ui/Avatar";
import type { MemberColor } from "@/models/Group";

// ─── Tipos de datos públicos ────────────────────────────────────────────────

export interface MemberInfo {
    readonly nickname: string;
    readonly color: MemberColor;
}

export interface PersonRowProps {
    readonly name: string;
    readonly color?: MemberColor;
    readonly amount?: string;
    readonly status?: PaymentStatus;
    readonly action?: "claim" | "none";
    readonly onAction?: () => void;
}

export interface TransactionRowProps {
    readonly name: string;
    readonly amount: string;
    readonly variant?: TransactionVariant;
    readonly action?: "payable" | "readonly";
    readonly onAction?: () => void;
}

export interface PersonBalanceCardProps {
    readonly name: string;
    readonly color: MemberColor;
    readonly balance: string;
    readonly balanceStatus: BalanceStatus;
    readonly items: TransactionRowProps[];
}

export interface DebtCardProps {
    readonly title: string;
    readonly amount: string;
    readonly description: string;
    readonly children: ReactNode;
}

export interface OwedCardProps {
    readonly title: string;
    readonly amount: string;
    readonly description: string;
    readonly assigned: MemberInfo[];
    readonly owner: MemberInfo;
    readonly tag?: string;
    readonly action?: { readonly label: string; readonly onClick: () => void };
}

export interface AmountTitleProps {
    readonly title: string;
    readonly amount: string;
    readonly tag?: string;
}

export interface PeopleMetaProps {
    readonly assigned: MemberInfo[];
    readonly owner: MemberInfo;
}

export interface EmptyStateProps {
    readonly message: string;
}

// ─── Card base ──────────────────────────────────────────────────────────────

export interface ExpenseCardProps {
    readonly children: ReactNode;
    readonly className?: string;
}

export function ExpenseCard({ children, className = "" }: ExpenseCardProps): ReactNode {
    return (
        <article className={`rounded-xl border border-brand/50 bg-panel p-5 ${className}`}>
            {children}
        </article>
    );
}

export function AmountTitle({ title, amount, tag }: AmountTitleProps): ReactNode {
    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium">
            <h3>{title}</h3>
            <span className="text-brand">{amount}</span>
            {tag && (
                <span className="rounded-full bg-group-paper px-3 py-1 text-sm text-brand">
                    {tag}
                </span>
            )}
        </div>
    );
}

// ─── Meta de personas ───────────────────────────────────────────────────────

export function PeopleMeta({ assigned, owner }: PeopleMetaProps): ReactNode {
    return (
        <div className="flex flex-wrap items-center gap-4 text-sm text-group-muted">
            <div className="flex items-center gap-1.5">
                <span>Asignado a:</span>
                <span className="flex -space-x-1">
                    {assigned.map((member) => (
                        <Avatar
                            key={member.nickname}
                            color={member.color}
                            name={member.nickname}
                        />
                    ))}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <span>A cargo de:</span>
                <Avatar color={owner.color} name={owner.nickname} />
            </div>
        </div>
    );
}

// ─── PersonRow ──────────────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG = {
    paid: { badgeClasses: "bg-group-green/70 text-brand-foreground", label: "Pagó" },
    partial: { badgeClasses: "bg-group-amber/70 text-brand-foreground", label: "Parcial" },
    pending: { badgeClasses: "bg-field/70 text-group-muted", label: "Pendiente" },
    unpaid: { badgeClasses: "bg-field/70 text-group-muted", label: "No pagó" },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS_CONFIG;

export function PersonRow({
                              name,
                              color,
                              amount,
                              status = "unpaid",
                              action = "none",
                              onAction,
                          }: PersonRowProps): ReactNode {
    const config = PAYMENT_STATUS_CONFIG[status];

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <Avatar color={color} name={name} />
                <span className="truncate text-sm font-medium">{name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {amount && (
                    <span className="text-sm font-semibold text-brand">{amount}</span>
                )}
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${config.badgeClasses}`}>
                    {config.label}
                </span>
                {action === "claim" && (
                    <Button variant="danger" className="hidden sm:block" onClick={onAction}>
                        Reclamar pago
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── TransactionRow ─────────────────────────────────────────────────────────

const TRANSACTION_VARIANTS = {
    debt: "text-group-danger",
    credit: "text-brand",
} as const;

export type TransactionVariant = keyof typeof TRANSACTION_VARIANTS;

export function TransactionRow({
                                   name,
                                   amount,
                                   variant = "credit",
                                   action = "readonly",
                                   onAction,
                               }: TransactionRowProps): ReactNode {
    const amountColor = TRANSACTION_VARIANTS[variant];

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">{name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <span className={`text-sm font-semibold ${amountColor}`}>{amount}</span>
                {action === "payable" && (
                    <Button variant="success" className="hidden sm:block" onClick={onAction}>
                        Marcar como pagado
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── PersonBalanceCard ──────────────────────────────────────────────────────

const BALANCE_COLORS = {
    positive: "text-group-green",
    negative: "text-group-danger",
    neutral: "text-group-muted",
} as const;

export type BalanceStatus = keyof typeof BALANCE_COLORS;

export function PersonBalanceCard({
                                      name,
                                      color,
                                      balance,
                                      balanceStatus,
                                      items,
                                  }: PersonBalanceCardProps): ReactNode {
    const balanceColor = BALANCE_COLORS[balanceStatus];

    return (
        <ExpenseCard className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar color={color} name={name} />
                    <h3 className="text-base font-semibold">{name}</h3>
                </div>
                <p className={`text-sm font-bold ${balanceColor}`}>{balance}</p>
            </div>

            {items.length > 0 && (
                <div className="mt-4 space-y-2">
                    {items.map((item, index) => (
                        <TransactionRow key={`${name}-${item.name}-${index}`} {...item} />
                    ))}
                </div>
            )}
        </ExpenseCard>
    );
}

// ─── ProposalCard ───────────────────────────────────────────────────────────

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

export interface ProposalCardProps {
    readonly title: string;
    readonly amount: string;
    readonly description: string;
    readonly assigned: MemberInfo[];
    readonly owner: MemberInfo;
    readonly status?: keyof typeof PROPOSAL_VARIANTS;
}

export function ProposalCard({
                                 title,
                                 amount,
                                 description,
                                 assigned,
                                 owner,
                                 status = "pending",
                             }: ProposalCardProps): ReactNode {
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

// ─── DebtCard / OwedCard ────────────────────────────────────────────────────

export function DebtCard({ title, amount, description, children }: DebtCardProps): ReactNode {
    return (
        <ExpenseCard>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <AmountTitle title={title} amount={amount} />
            </div>
            <p className="mt-3 text-sm text-group-muted">{description}</p>
            <div className="mt-3 space-y-2">{children}</div>
        </ExpenseCard>
    );
}

export function OwedCard({
                             title,
                             amount,
                             description,
                             assigned,
                             owner,
                             tag,
                             action,
                         }: OwedCardProps): ReactNode {
    return (
        <ExpenseCard className="flex min-h-48 flex-col justify-between">
            <div className="space-y-2">
                <AmountTitle title={title} amount={amount} tag={tag} />
                <p className="text-sm text-group-muted">{description}</p>
                <PeopleMeta assigned={assigned} owner={owner} />
            </div>
            {action && (
                <div className="mt-4 flex justify-end">
                    <Button variant="success" onClick={action.onClick}>
                        {action.label}
                    </Button>
                </div>
            )}
        </ExpenseCard>
    );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

export function EmptyState({ message }: EmptyStateProps): ReactNode {
    return (
        <div className="rounded-xl bg-panel px-6 py-8 text-center text-sm font-medium text-warm-muted">
            {message}
        </div>
    );
}