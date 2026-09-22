import type { ReactNode } from "react";
import Button from "@/components/Button.tsx";
import type { MembeColor } from "@/models/Group.ts";

const COLOR_CLASSES: Record<string, string> = {
    RED:        "bg-custom-red/50",
    BLUE:       "bg-custom-blue/50",
    GREEN:      "bg-custom-green/50",
    YELLOW:     "bg-custom-yellow/50",
    ORANGE:     "bg-custom-orange/50",
    PURPLE:     "bg-custom-purple/50",
    PINK:       "bg-custom-pink/50",
    LIGHT_BLUE: "bg-custom-light-blue/50",
};

const FALLBACK_AVATAR_CLASS = "bg-group-muted/50";

// eslint-disable-next-line react-refresh/only-export-components
export function colorToClass(color?: MembeColor | string): string {
    if (!color) return FALLBACK_AVATAR_CLASS;
    if (color.startsWith("bg-")) return color;
    return COLOR_CLASSES[color] ?? FALLBACK_AVATAR_CLASS;
}

// --- AVATAR ---

export interface AvatarProps {
    color?: MembeColor;
    name: string;
}

export function Avatar({ color, name }: AvatarProps) {
    return (
        <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold text-brand-foreground ${colorToClass(color)}`}
            aria-hidden
        >
      {name.at(0)?.toUpperCase() ?? "?"}
    </span>
    );
}

// --- CARD BASE ---

export interface ExpenseCardProps {
    children: ReactNode;
    className?: string;
}

export function ExpenseCard({ children, className = "" }: ExpenseCardProps) {
    return (
        <article className={`rounded-xl border border-brand/50 bg-panel p-5 ${className}`}>
            {children}
        </article>
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
            {tag && (
                <span className="rounded-full bg-group-paper px-3 py-1 text-sm text-brand">{tag}</span>
            )}
        </div>
    );
}

// --- META DE PERSONAS ---

export interface MemberInfo {
    nickname: string;
    color: MembeColor;
}

export interface PeopleMetaProps {
    assigned: MemberInfo[];
    owner: MemberInfo;
}

export function PeopleMeta({ assigned, owner }: PeopleMetaProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 text-sm text-group-muted">
            <div className="flex items-center gap-1.5">
                <span>Asignado a:</span>
                <span className="flex -space-x-1">
          {assigned.map((member) => (
              <Avatar key={member.nickname} color={member.color} name={member.nickname} />
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

// --- PERSON ROW (deudores de un gasto que me deben) ---

const PAYMENT_STATUS_CONFIG = {
    paid: { badgeClasses: "bg-group-green/70 text-brand-foreground", label: "Pagó" },
    partial: { badgeClasses: "bg-group-amber/70 text-brand-foreground", label: "Parcial" },
    pending: { badgeClasses: "bg-field/70 text-group-muted", label: "Pendiente" },
    unpaid: { badgeClasses: "bg-field/70 text-group-muted", label: "No pagó" },
} as const;

export interface PersonRowProps {
    name: string;
    color?: MembeColor;
    amount?: string;
    status?: keyof typeof PAYMENT_STATUS_CONFIG;
    action?: "claim" | "none";
    onAction?: () => void;
}

export function PersonRow({
                              name,
                              color,
                              amount,
                              status = "unpaid",
                              action = "none",
                              onAction,
                          }: PersonRowProps) {
    const config = PAYMENT_STATUS_CONFIG[status];

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <Avatar color={color} name={name} />
                <span className="truncate text-sm font-medium">{name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {amount && <span className="text-sm font-semibold text-brand">{amount}</span>}
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

// --- TRANSACTION ROW (items dentro de PersonBalanceCard) ---

const TRANSACTION_VARIANTS = {
    debt: "text-group-danger",
    credit: "text-brand",
} as const;

export interface TransactionRowProps {
    name: string;
    amount: string;
    variant?: keyof typeof TRANSACTION_VARIANTS;
    action?: "payable" | "readonly";
    onAction?: () => void;
}

export function TransactionRow({
                                   name,
                                   amount,
                                   variant = "credit",
                                   action = "readonly",
                                   onAction,
                               }: TransactionRowProps) {
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

// --- PERSON BALANCE CARD ---

const BALANCE_COLORS = {
    positive: "text-group-green",
    negative: "text-group-danger",
    neutral: "text-group-muted",
} as const;

export interface PersonBalanceCardProps {
    name: string;
    color: MembeColor;
    balance: string;
    balanceStatus: keyof typeof BALANCE_COLORS;
    items: TransactionRowProps[];
}

export function PersonBalanceCard({
                                      name,
                                      color,
                                      balance,
                                      balanceStatus,
                                      items,
                                  }: PersonBalanceCardProps) {
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

// --- PROPOSAL CARD ---

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
    title: string;
    amount: string;
    description: string;
    assigned: MemberInfo[];
    owner: MemberInfo;
    status?: keyof typeof PROPOSAL_VARIANTS;
}

export function ProposalCard({
                                 title,
                                 amount,
                                 description,
                                 assigned,
                                 owner,
                                 status = "pending",
                             }: ProposalCardProps) {
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

// --- DEBT CARD (gastos que me deben) ---

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
                <AmountTitle title={title} amount={amount} />
            </div>
            <p className="mt-3 text-sm text-group-muted">{description}</p>
            <div className="mt-3 space-y-2">{children}</div>
        </ExpenseCard>
    );
}

// --- OWED CARD (gastos que debo) ---

export interface OwedCardProps {
    title: string;
    amount: string;
    description: string;
    assigned: MemberInfo[];
    owner: MemberInfo;
    tag?: string;
    action?: { label: string; onClick: () => void };
}

export function OwedCard({
                             title,
                             amount,
                             description,
                             assigned,
                             owner,
                             tag,
                             action,
                         }: OwedCardProps) {
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

// --- EMPTY STATE ---

export interface EmptyStateProps {
    message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
    return (
        <div className="rounded-xl bg-panel px-6 py-8 text-center text-sm font-medium text-warm-muted">
            {message}
        </div>
    );
}