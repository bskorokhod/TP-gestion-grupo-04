import type {ChangeEvent} from "react";

import type {Member} from "@/models/User";
import {cn} from "@/lib/cn.ts";

export interface MemberInfoCardProps {
    readonly member: Member;
}

interface InfoField {
    readonly label: string;
    readonly value: string;
}

export function MemberInfoCard ({ member }: MemberInfoCardProps){
    const fields: ReadonlyArray<InfoField> = [
        { label: "Correo:", value: member.email },
        { label: "Alias/CVU:", value: member.alias },
    ];

    return (
        <div className="flex flex-col gap-3 items-start flex-1 bg-panel rounded-2xl border border-field/50 py-6 px-7 overflow-hidden">
            <div className="flex flex-row justify-between items-center self-stretch">
                <div className="flex flex-row gap-2.5 items-center">
                    <div className="flex flex-row justify-center items-center w-11 h-11 bg-custom-red rounded-[31px] overflow-hidden shrink-0">
                        <p className="text-lg font-medium text-panel">{member.initial}</p>
                    </div>
                    <div className="flex flex-col items-start">
                        <p className="text-xl font-semibold text-ink leading-6.5">
                            {member.name}
                        </p>
                        <p className="text-base font-normal text-warm-muted whitespace-nowrap">
                            {member.fullName}
                        </p>
                    </div>
                </div>
                <p className="text-2xl font-semibold text-olive">
                    {member.percentage}%
                </p>
            </div>
            {fields.map((field) => (
                <p key={field.label} className="text-base text-ink self-stretch">
                    <span className="font-semibold">{field.label}</span> {field.value}
                </p>
            ))}
        </div>
    );
}


export type LockState = "locked" | "unlocked";

export interface PercentageCardMember {
    readonly memberId: string;
    readonly initial: string;
    readonly name: string;
    readonly fullName: string;
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

const LOCK_ICON: Record<LockState, string> = {
    locked: "🔒",
    unlocked: "🔓",
};

const LOCK_LABEL: Record<LockState, string> = {
    locked: "Desbloquear porcentaje",
    unlocked: "Bloquear porcentaje",
};

const INPUT_CLASSES: Record<LockState, string> = {
    locked:
        "flex flex-row justify-center items-center w-[200px] h-[52px] bg-input-surface rounded-xl border border-field px-3.5 overflow-hidden opacity-70",
    unlocked:
        "flex flex-row justify-center items-center w-[200px] h-[52px] bg-input-surface rounded-xl border border-brand px-3.5 overflow-hidden",
};

export function PercentageCard ({
    member,
    percentage,
    locked,
    disabled = false,
    errorMessage,
    onPercentageChange,
    onToggleLock,
}: PercentageCardProps){
    const lockState: LockState = locked ? "locked" : "unlocked";
    const hasError = Boolean(errorMessage);
    const isInputDisabled = locked || disabled;

    const handlePercentageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        if (rawValue === "") {
            onPercentageChange(member.memberId, 0);
            return;
        }

        const parsedValue = Number(rawValue);
        if (!Number.isNaN(parsedValue)) {
            onPercentageChange(member.memberId, parsedValue);
        }
    };

    return (
        <div className="flex flex-col gap-2 items-start self-stretch">
            <div className="flex flex-row justify-between items-center self-stretch bg-background rounded-xl border border-field/50 py-6 px-7 overflow-hidden">
                <div className="flex flex-row gap-2.5 items-center">
                    <div className="flex flex-row justify-center items-center w-11 h-11 bg-custom-red rounded-[31px] overflow-hidden shrink-0">
                        <p className="text-lg font-medium text-panel">{member.initial}</p>
                    </div>
                    <div className="flex flex-col items-start">
                        <p className="text-[22px] font-semibold text-ink leading-6.5">
                            {member.name}
                        </p>
                        <p className="text-base font-normal text-warm-muted whitespace-nowrap">
                            {member.fullName}
                        </p>
                    </div>
                </div>
                <div className="flex flex-row gap-6 items-center">
                    <div className={cn(INPUT_CLASSES[lockState], hasError && "border-group-danger")}>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                            value={percentage}
                            disabled={isInputDisabled}
                            aria-invalid={hasError}
                            aria-label={`Porcentaje de ${member.name}`}
                            onChange={handlePercentageInputChange}
                            className="w-full bg-brand-foreground text-base font-normal text-center text-ink outline-none"
                        />
                        <span className="text-base font-normal text-placeholder">%</span>
                    </div>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggleLock(member.memberId)}
                        aria-label={LOCK_LABEL[lockState]}
                        aria-pressed={locked}
                        className="flex flex-row justify-center items-center w-8 h-8 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {LOCK_ICON[lockState]}
                    </button>
                </div>
            </div>
            {hasError && (
                <p role="alert" className="text-sm font-medium text-group-danger px-2">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}
