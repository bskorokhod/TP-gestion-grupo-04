import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import type { Member } from "@/models/Group.ts";
import { MemberNicknameSchema } from "@/models/Nickname.ts";
import { MemberCvuSchema } from "@/models/Cvu.ts";
import { Avatar } from "@/components/ui/Avatar.tsx";
import { CardActionButton } from "@/components/ui/CardActionButton";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { InlineEditForm } from "@/components/Forms/InlineEditForm";

export interface MemberInfoCardProps {
    readonly member: Member;
    readonly isMine?: boolean;
    readonly onSaveNickname?: (nickname: string) => Promise<void>;
    readonly isSavingNickname?: boolean;
    readonly onSaveCvu?: (cvu: string) => Promise<void>;
    readonly isSavingCvu?: boolean;
}

export function MemberInfoCard({
                                   member,
                                   isMine = false,
                                   onSaveNickname,
                                   isSavingNickname = false,
                                   onSaveCvu,
                                   isSavingCvu = false,
                               }: MemberInfoCardProps) {
    const percentage = member.percentage ?? 0;
    const canEdit = isMine && Boolean(onSaveNickname);

    const nicknameEdit = useInlineEdit({
        initialValue: member.nickname,
        schema: MemberNicknameSchema,
        onSave: onSaveNickname,
        canEdit,
        isSaving: isSavingNickname,
    });

    return (
        <div className="flex flex-col gap-3 items-start flex-1 bg-panel rounded-2xl border border-field/50 py-6 px-7 overflow-hidden">
            <div className="flex flex-row justify-between items-center gap-3 self-stretch">
                <div className="flex min-w-0 flex-1 flex-row gap-2.5 items-center">
                    <Avatar size="lg" name={member.nickname} color={member.color} photoUrl={member.photoUrl} />

                    {nicknameEdit.isEditing ? (
                        <InlineEditForm
                            value={nicknameEdit.draft}
                            onChange={nicknameEdit.setDraft}
                            onKeyDown={nicknameEdit.handleKeyDown}
                            onConfirm={nicknameEdit.confirmEditing}
                            onCancel={nicknameEdit.cancelEditing}
                            isValid={nicknameEdit.validation.success}
                            canConfirm={nicknameEdit.canConfirm}
                            isSaving={isSavingNickname}
                            maxLength={30}
                            ariaLabel="Editar tu apodo en el grupo"
                            inputClassName="text-lg font-semibold"
                        />
                    ) : (
                        <div className="flex min-w-0 flex-1 flex-col items-start">
                            <div className="flex h-6.5 min-w-0 max-w-full flex-row items-center gap-2">
                                <p className="min-w-0 truncate text-xl font-semibold text-ink leading-6.5">
                                    {member.nickname}
                                </p>
                                {canEdit && (
                                    <CardActionButton
                                        icon={faPenToSquare}
                                        label="Editar tu apodo"
                                        onClick={nicknameEdit.startEditing}
                                    />
                                )}
                            </div>
                            <p className="max-w-full truncate text-base font-normal text-warm-muted">
                                {member.username}
                            </p>
                        </div>
                    )}
                </div>

                {!nicknameEdit.isEditing && (
                    <p className="shrink-0 whitespace-nowrap text-2xl font-semibold text-olive">{percentage}%</p>
                )}
            </div>

            <CvuRow
                cvu={member.cvu}
                canEdit={isMine && Boolean(onSaveCvu)}
                onSave={onSaveCvu}
                isSaving={isSavingCvu}
            />

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

export interface CvuRowProps {
    readonly cvu: string | null | undefined;
    readonly canEdit: boolean;
    readonly onSave?: (cvu: string) => Promise<void>;
    readonly isSaving: boolean;
}

function CvuRow({ cvu, canEdit, onSave, isSaving }: CvuRowProps) {
    const current = cvu ?? "";
    const cvuEdit = useInlineEdit({
        initialValue: current,
        schema: MemberCvuSchema,
        onSave,
        canEdit,
        isSaving,
    });

    if (cvuEdit.isEditing) {
        return (
            <InlineEditForm
                value={cvuEdit.draft}
                onChange={cvuEdit.setDraft}
                onKeyDown={cvuEdit.handleKeyDown}
                onConfirm={cvuEdit.confirmEditing}
                onCancel={cvuEdit.cancelEditing}
                isValid={cvuEdit.validation.success}
                canConfirm={cvuEdit.canConfirm}
                isSaving={isSaving}
                maxLength={22}
                placeholder="CVU o alias"
                ariaLabel="Editar tu alias o CVU en el grupo"
                inputClassName="text-base"
            />
        );
    }

    return (
        <div className="flex min-w-0 flex-row items-center gap-2 self-stretch text-base text-ink">
            <p className="min-w-0 truncate">
                <span className="font-semibold">Alias/CVU:</span>{" "}
                {current || <span className="text-warm-muted">Sin cargar</span>}
            </p>
            {canEdit && (
                <CardActionButton icon={faPenToSquare} label="Editar tu alias o CVU" onClick={cvuEdit.startEditing} />
            )}
        </div>
    );
}

export interface PercentageCardProps {
    readonly member: Member;
    readonly percentage: number;
    readonly editable: boolean;
    readonly inputValue?: string;
    readonly disabled?: boolean;
    readonly onInputChange?: (value: string) => void;
}

export function PercentageCard({
                                   member,
                                   percentage,
                                   editable,
                                   inputValue = "",
                                   disabled = false,
                                   onInputChange,
                               }: PercentageCardProps) {
    const [profileOpen, setProfileOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

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
                        aria-label={`Ver perfil de ${member.nickname}`}
                        aria-expanded={profileOpen}
                        className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer transition-transform hover:scale-105"
                    >
                        <Avatar size="md" name={member.nickname} color={member.color} photoUrl={member.photoUrl} />
                    </button>
                    <p className="text-base font-semibold text-ink leading-6 truncate max-w-full">
                        {member.nickname}
                        {editable && <span className="ml-2 text-sm font-medium text-brand">(vos)</span>}
                    </p>
                </div>
                <div className="flex flex-row gap-2 items-center shrink-0">
                    {editable ? (
                        <div className="flex flex-row justify-center items-center w-40 h-9 bg-input-surface rounded-xl border border-brand px-3 overflow-hidden">
                            <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={100}
                                step="any"
                                value={inputValue}
                                placeholder="0"
                                disabled={disabled}
                                aria-label="Tu porcentaje de propiedad"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => onInputChange?.(e.target.value)}
                                onWheel={(event) => event.currentTarget.blur()}
                                className="w-full bg-brand-foreground text-base font-normal text-center text-ink outline-none"
                            />
                            <span className="text-base font-normal text-placeholder">%</span>
                        </div>
                    ) : (
                        <p
                            aria-label={`Porcentaje de ${member.nickname}`}
                            className="text-base font-semibold text-olive whitespace-nowrap"
                        >
                            {percentage}%
                        </p>
                    )}
                </div>

                {profileOpen && (
                    <div
                        role="dialog"
                        aria-label={`Perfil de ${member.nickname}`}
                        className="absolute left-3 top-full z-30 mt-2 flex flex-row items-center gap-3 rounded-xl border border-field/60 bg-panel px-4 py-3 shadow-soft"
                    >
                        <Avatar size="lg" name={member.nickname} color={member.color} photoUrl={member.photoUrl} />
                        <div className="flex flex-col items-start min-w-0">
                            <p className="text-base font-semibold text-ink">{member.nickname}</p>
                            <p className="text-sm font-normal text-warm-muted break-all">{member.username}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
