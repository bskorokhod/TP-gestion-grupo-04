import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type {Member, MemberColor} from "@/models/Group.ts";
import { cn } from "@/lib/cn.ts";
import { memberColorClass } from "@/lib/colors"
import {Avatar} from "@/components/ui/Avatar.tsx";

const ROLE_LABEL: Record<string, string> = {
    FOUNDER: "Fundador/a",
    ADMIN: "Administrador/a",
    MEMBER: "Miembro",
};

function roleLabel(role: string): string {
    return ROLE_LABEL[role] ?? role;
}

export interface MemberInfoCardProps {
    readonly member: Member;
}

export function MemberInfoCard({ member }: MemberInfoCardProps) {
    const initial = member.nickname.charAt(0).toUpperCase();
    const percentage = member.percentage !== null ? member.percentage : 0;
    const hasPhoto = Boolean(member.photoUrl);

    return (
        <div className="flex flex-col gap-3 items-start flex-1 bg-panel rounded-2xl border border-field/50 py-6 px-7 overflow-hidden">
            <div className="flex flex-row justify-between items-center gap-3 self-stretch">
                <div className="flex min-w-0 flex-1 flex-row gap-2.5 items-center">
                    {hasPhoto ? (
                        <img
                            src={member.photoUrl!}
                            alt={member.nickname}
                            className="w-11 h-11 rounded-[31px] object-cover shrink-0"
                        />
                    ) : (
                    <div
                        className={cn(
                            "flex flex-row justify-center items-center w-11 h-11 rounded-[31px] overflow-hidden shrink-0",
                            memberColorClass(member.color),
                        )}
                    >
                        <p className="text-lg font-medium text-panel">{initial}</p>
                    </div>
                    )}
                    <div className="flex min-w-0 flex-col items-start">
                        <p className="max-w-full truncate text-xl font-semibold text-ink leading-6.5">
                            {member.nickname}
                        </p>
                        <p className="max-w-full truncate text-base font-normal text-warm-muted">
                            {member.username}
                        </p>
                    </div>
                </div>
                <p className="shrink-0 whitespace-nowrap text-2xl font-semibold text-olive">{percentage}%</p>
            </div>

            <p className="text-base text-ink self-stretch">
                <span className="font-semibold">Rol:</span> {roleLabel(member.role)}
            </p>
            {member.joinedAt && (
                <p className="text-base text-ink self-stretch">
                    <span className="font-semibold">Miembro desde:</span>{" "}
                    {new Date(member.joinedAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            )}
        </div>
    );
}


export type LockState = "locked" | "unlocked";

export interface PercentageCardMember {
    readonly memberId: string;
    readonly initial: string;
    readonly name: string;
    readonly fullName: string;
    readonly color?: MemberColor;
    readonly photoUrl?: string | null;
}

export interface PercentageCardProps {
    readonly member: PercentageCardMember;
    readonly percentage: number;
    readonly locked: boolean;
    readonly disabled?: boolean;
    readonly errorMessage?: string;
    readonly onPercentageChange: (memberId: string, value: number) => void;
    readonly onToggleLock: (memberId: string) => void;
}

const LOCK_ICON: Record<LockState, IconDefinition> = {
    locked: faLock,
    unlocked: faLockOpen,
};

const LOCK_LABEL: Record<LockState, string> = {
    locked: "Desbloquear porcentaje",
    unlocked: "Bloquear porcentaje",
};

const INPUT_CLASSES: Record<LockState, string> = {
    locked:
        "flex flex-row justify-center items-center w-[92px] h-9 bg-input-surface rounded-xl border border-field px-3 overflow-hidden opacity-70",
    unlocked:
        "flex flex-row justify-center items-center w-[92px] h-9 bg-input-surface rounded-xl border border-brand px-3 overflow-hidden",
};

function percentageToInput(value: number): string {
    return Number.isFinite(value) ? String(value) : "";
}

export function PercentageCard({member, percentage, locked, disabled = false, errorMessage, onPercentageChange, onToggleLock }: PercentageCardProps) {
    const lockState: LockState = locked ? "locked" : "unlocked";
    const hasError = Boolean(errorMessage);
    const isInputDisabled = locked || disabled;

    // El valor del input se maneja como string para poder dejarlo "vacío" (placeholder 0)
    // sin forzar un 0 adelante. Para cálculos/guardado, vacío = 0.
    const [inputValue, setInputValue] = useState<string>(() => percentageToInput(percentage));
    const [profileOpen, setProfileOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Sincronizar cuando el porcentaje cambia desde afuera (ajuste equitativo, bloqueo,
    // cancelar, recarga) sin pisar un campo vaciado a propósito.
    useEffect(() => {
        setInputValue((prev) => {
            const prevNumber = prev.trim() === "" ? 0 : Number(prev);
            return !Number.isNaN(prevNumber) && prevNumber === percentage ? prev : percentageToInput(percentage);
        });
    }, [percentage]);

    // Cerrar el popup de perfil al clickear afuera o presionar Escape.
    useEffect(() => {
        if (!profileOpen) return;
        const onPointerDown = (event: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setProfileOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [profileOpen]);

    const handlePercentageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        setInputValue(rawValue);
        if (rawValue.trim() === "") {
            onPercentageChange(member.memberId, 0);
            return;
        }
        const parsedValue = Number(rawValue);
        if (!Number.isNaN(parsedValue)) {
            onPercentageChange(member.memberId, parsedValue);
        }
    };

    return (
        <div className="flex flex-col gap-1 items-start self-stretch">
            <div
                ref={cardRef}
                className="relative flex flex-row justify-between items-center gap-3 self-stretch bg-background rounded-xl border border-field/50 py-2 px-4"
            >
                <div className="flex flex-row gap-2.5 items-center min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => setProfileOpen((open) => !open)}
                        aria-label={`Ver perfil de ${member.name}`}
                        aria-expanded={profileOpen}
                        className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer transition-transform hover:scale-105"
                    >
                        <Avatar size="md" name={member.name} color={member.color} photoUrl={member.photoUrl} />
                    </button>
                    <p className="text-base font-semibold text-ink leading-6 truncate max-w-full">
                        {member.name}
                    </p>
                </div>
                <div className="flex flex-row gap-2 items-center shrink-0">
                    <div className={cn(INPUT_CLASSES[lockState], hasError && "border-group-danger")}>
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={100}
                            step="any"
                            value={inputValue}
                            placeholder="0"
                            disabled={isInputDisabled}
                            aria-invalid={hasError}
                            aria-label={`Porcentaje de ${member.name}`}
                            onChange={handlePercentageInputChange}
                            onWheel={(event) => event.currentTarget.blur()}
                            className="w-full bg-brand-foreground text-base font-normal text-center text-ink outline-none placeholder:text-placeholder"
                        />
                        <span className="text-base font-normal text-placeholder">%</span>
                    </div>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggleLock(member.memberId)}
                        aria-label={LOCK_LABEL[lockState]}
                        aria-pressed={locked}
                        className="flex flex-row justify-center items-center w-7 h-7 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={LOCK_ICON[lockState]} className="h-4 w-4 text-primary" />
                    </button>
                </div>

                {profileOpen && (
                    <div
                        role="dialog"
                        aria-label={`Perfil de ${member.name}`}
                        className="absolute left-3 top-full z-30 mt-2 flex flex-row items-center gap-3 rounded-xl border border-field/60 bg-panel px-4 py-3 shadow-soft"
                    >
                        <Avatar size="lg" name={member.name} color={member.color} photoUrl={member.photoUrl} />
                        <div className="flex flex-col items-start min-w-0">
                            <p className="text-base font-semibold text-ink">{member.name}</p>
                            <p className="text-sm font-normal text-warm-muted break-all">{member.fullName}</p>
                        </div>
                    </div>
                )}
            </div>
            {hasError && (
                <p role="alert" className="text-sm font-medium text-group-danger px-2">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}
