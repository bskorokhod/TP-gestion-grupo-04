import { useState, type ComponentProps, type ReactNode } from "react";
import Button from "@/components/Button.tsx";
import { ReceiptModal } from "@/components/modals/ReceiptModal.tsx";
import { Avatar } from "@/components/ui/Avatar";
import type { MemberColor } from "@/models/Group";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faPenToSquare, faReceipt } from "@fortawesome/free-solid-svg-icons";
import {BALANCE_COLORS, PAYMENT_STATUS_CONFIG, TRANSACTION_VARIANTS, type BalanceStatus, type PaymentStatus, type TransactionVariant,} from "@/constants/expenses.ts";

export interface MemberInfo {
    readonly nickname: string;
    readonly color: MemberColor;
    readonly photoUrl?: string | null;
}

export interface PersonRowProps {
    readonly name: string;
    readonly color?: MemberColor;
    readonly amount?: string;
    readonly status?: PaymentStatus;
    readonly action?: "claim" | "none";
    readonly onAction?: () => void;
    readonly photoUrl?: string | null;
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
    readonly photoUrl?: string | null;
}

export interface DebtCardProps {
    readonly title: string;
    readonly amount: string;
    readonly description: string;
    readonly assigned?: MemberInfo[];
    readonly owner?: MemberInfo;
    readonly receiptUrl?: string | null;
    readonly onEdit?: () => void;
    readonly children: ReactNode;
}

export interface OwedCardProps {
    readonly title: string;
    readonly amount: string;
    readonly description: string;
    readonly assigned: MemberInfo[];
    readonly owner: MemberInfo;
    readonly tag?: string;
    readonly receiptUrl?: string | null;
    readonly onReport?: () => void;
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
                            photoUrl={member.photoUrl}
                        />
                    ))}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <span>A cargo de:</span>
                <Avatar color={owner.color} name={owner.nickname} photoUrl={owner.photoUrl}/>
            </div>
        </div>
    );
}

export function PersonRow({name, color, amount, status = "unpaid", action = "none", onAction, photoUrl}: PersonRowProps): ReactNode {
    const config = PAYMENT_STATUS_CONFIG[status];

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-group-paper px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <Avatar color={color} name={name} photoUrl={photoUrl}/>
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

export function TransactionRow({name, amount, variant = "credit", action = "readonly", onAction,}: TransactionRowProps): ReactNode {
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

export function PersonBalanceCard({name, color, balance, balanceStatus, items, }: PersonBalanceCardProps): ReactNode {
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

// TODO !! Agregar proposal otra vez
// export interface ProposalCardProps {
//     readonly title: string;
//     readonly amount: string;
//     readonly description: string;
//     readonly assigned: MemberInfo[];
//     readonly owner: MemberInfo;
//     readonly status?: keyof typeof PROPOSAL_VARIANTS;
// }
//
// export function ProposalCard({title, amount, description, assigned, owner, status = "pending",}: ProposalCardProps): ReactNode {
//     return (
//         <ExpenseCard className="border-group-amber">
//             <div className="space-y-2">
//                 <AmountTitle title={title} amount={amount} />
//                 <p className="text-sm text-group-muted">{description}</p>
//                 <PeopleMeta assigned={assigned} owner={owner} />
//             </div>
//             <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
//                 <button className="inline-flex items-center gap-1 truncate text-left text-sm font-medium text-brand">
//                     Ver votos ({config.votesLabel} votaron)
//                     <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" aria-hidden />
//                 </button>
//                 <div className="flex shrink-0 gap-2">
//                     <Button variant={config.primaryBtn.variant}>{config.primaryBtn.label}</Button>
//                     <Button variant={config.secondaryBtn.variant}>{config.secondaryBtn.label}</Button>
//                 </div>
//             </div>
//         </ExpenseCard>
//     );
// }

type IconProp = ComponentProps<typeof FontAwesomeIcon>["icon"];

interface CardActionButtonProps {
    readonly icon: IconProp;
    readonly label: string;
    readonly onClick?: () => void;
}

/** Botón de ícono para la esquina superior derecha de la tarjeta, con tooltip en hover y foco. */
function CardActionButton({ icon, label, onClick }: CardActionButtonProps): ReactNode {
    return (
        <span className="group relative inline-flex">
            <button
                type="button"
                onClick={onClick}
                aria-label={label}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-brand transition-colors hover:bg-group-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
                <FontAwesomeIcon icon={icon} className="h-4 w-4" aria-hidden />
            </button>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-brand px-2 py-1 text-xs font-medium text-brand-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
                {label}
            </span>
        </span>
    );
}

interface ReceiptActionProps {
    readonly title: string;
    readonly receiptUrl?: string | null;
}

function ReceiptAction({ title, receiptUrl }: ReceiptActionProps): ReactNode {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    return (
        <>
            <CardActionButton icon={faReceipt} label="Ver comprobante adjunto" onClick={() => setIsModalOpen(true)} />
            {isModalOpen && (
                <ReceiptModal title={title} receiptUrl={receiptUrl} onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}

export function DebtCard({title, amount, description, assigned, owner, receiptUrl, onEdit, children,}: DebtCardProps): ReactNode {
    return (
        <ExpenseCard>
            <div className="flex items-start justify-between gap-2">
                <AmountTitle title={title} amount={amount} />
                <div className="flex shrink-0 items-center gap-1">
                    <ReceiptAction title={title} receiptUrl={receiptUrl} />
                    <CardActionButton icon={faPenToSquare} label="Editar" onClick={onEdit} />
                </div>
            </div>
            <p className="mt-3 text-sm text-group-muted">{description}</p>

            {assigned && owner && (
                <div className="mt-3">
                    <PeopleMeta assigned={assigned} owner={owner} />
                </div>
            )}

            <div className="mt-3 space-y-2">{children}</div>
        </ExpenseCard>
    );
}

export function OwedCard({title, amount, description, assigned, owner, tag, receiptUrl, onReport, action,}: OwedCardProps): ReactNode {
    return (
        <ExpenseCard className="flex min-h-48 flex-col justify-between">
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <AmountTitle title={title} amount={amount} tag={tag} />
                    <div className="flex shrink-0 items-center gap-1">
                        <ReceiptAction title={title} receiptUrl={receiptUrl} />
                        <CardActionButton icon={faFlag} label="Reportar" onClick={onReport} />
                    </div>
                </div>
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

export function EmptyState({ message }: EmptyStateProps): ReactNode {
    return (
        <div className="rounded-xl bg-panel px-6 py-8 text-center text-sm font-medium text-warm-muted">
            {message}
        </div>
    );
}