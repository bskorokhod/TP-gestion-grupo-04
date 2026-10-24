import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type {Member} from "@/models/Group.ts";
import { MemberNicknameSchema } from "@/models/Nickname.ts";
import { cn } from "@/lib/cn.ts";
import { memberColorClass } from "@/lib/colors"
import {Avatar} from "@/components/ui/Avatar.tsx";
import Button from "@/components/Button.tsx";
import { CardActionButton } from "@/components/ui/CardActionButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";

export interface MemberInfoCardProps {
    readonly member: Member;
    /** Solo la tarjeta del propio miembro puede editar el apodo; el resto se muestra en solo lectura. */
    readonly isMine?: boolean;
    /** Persiste el nuevo apodo (PATCH al backend). Si rechaza, la tarjeta se queda en edición para reintentar. */
    readonly onSaveNickname?: (nickname: string) => Promise<void>;
    readonly isSaving?: boolean;
}

export function MemberInfoCard({ member, isMine = false, onSaveNickname, isSaving = false }: MemberInfoCardProps) {
    const initial = member.nickname.charAt(0).toUpperCase();
    const percentage = member.percentage !== null ? member.percentage : 0;
    const hasPhoto = Boolean(member.photoUrl);
    const canEdit = isMine && Boolean(onSaveNickname);

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(member.nickname);

    // Si el apodo cambia desde afuera (ej. otra pestaña) mientras no se está editando, no queda un draft viejo.
    useEffect(() => {
        if (!isEditing) setDraft(member.nickname);
    }, [member.nickname, isEditing]);

    const validation = MemberNicknameSchema.safeParse(draft);
    const isDirty = draft.trim() !== member.nickname;
    const canConfirm = canEdit && validation.success && isDirty && !isSaving;

    function startEditing() {
        setDraft(member.nickname);
        setIsEditing(true);
    }

    function cancelEditing() {
        setDraft(member.nickname);
        setIsEditing(false);
    }

    async function confirmEditing() {
        if (!canConfirm || !validation.success || !onSaveNickname) return;
        try {
            await onSaveNickname(validation.data);
            setIsEditing(false);
        } catch {
            // El error ya se reporta (toast) en el llamador; se mantiene en edición para reintentar o cancelar.
        }
    }

    function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            event.preventDefault();
            void confirmEditing();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelEditing();
        }
    }

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

                    {isEditing ? (
                        <div className="flex min-w-0 flex-1 flex-row gap-2 items-center">
                            <input
                                type="text"
                                value={draft}
                                maxLength={30}
                                autoFocus
                                disabled={isSaving}
                                aria-label="Editar tu apodo en el grupo"
                                aria-invalid={!validation.success}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
                                onKeyDown={handleInputKeyDown}
                                className={cn(
                                    "min-w-0 flex-1 rounded-lg border bg-input-surface px-3 py-1.5 text-lg font-semibold text-ink outline-none",
                                    validation.success ? "border-brand" : "border-group-danger",
                                )}
                            />
                            <Button
                                type="button"
                                variant="success"
                                size="icon"
                                title="Confirmar"
                                aria-label="Confirmar nuevo apodo"
                                disabled={!canConfirm}
                                onClick={confirmEditing}
                            >
                                <FontAwesomeIcon icon={faCheck} aria-hidden />
                            </Button>
                            <Button
                                type="button"
                                variant="muted"
                                size="icon"
                                title="Cancelar"
                                aria-label="Cancelar edición del apodo"
                                disabled={isSaving}
                                onClick={cancelEditing}
                            >
                                <FontAwesomeIcon icon={faXmark} aria-hidden />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex min-w-0 flex-1 flex-col items-start">
                            <div className="flex min-w-0 max-w-full flex-row items-center gap-2">
                                <p className="min-w-0 truncate text-xl font-semibold text-ink leading-6.5">
                                    {member.nickname}
                                </p>
                                {canEdit && (
                                    <CardActionButton
                                        icon={faPenToSquare}
                                        label="Editar tu apodo"
                                        onClick={startEditing}
                                    />
                                )}
                            </div>
                            <p className="max-w-full truncate text-base font-normal text-warm-muted">
                                {member.username}
                            </p>
                        </div>
                    )}
                </div>
                {/* Durante la edición se oculta para que el input y los botones entren sin romper el layout. */}
                {!isEditing && (
                    <p className="shrink-0 whitespace-nowrap text-2xl font-semibold text-olive">{percentage}%</p>
                )}
            </div>

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


export interface PercentageCardProps {
    readonly member: Member;
    /** Porcentaje que se muestra en solo lectura (el guardado en el backend). */
    readonly percentage: number;
    /** Solo la tarjeta del propio miembro es editable: cada uno modifica únicamente su porcentaje. */
    readonly editable: boolean;
    /** Valor del input (string, para poder dejarlo vacío). Solo se usa si `editable`. */
    readonly inputValue?: string;
    readonly disabled?: boolean;
    readonly onInputChange?: (value: string) => void;
}

export function PercentageCard({member, percentage, editable, inputValue = "", disabled = false, onInputChange}: PercentageCardProps) {
    const [profileOpen, setProfileOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

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

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onInputChange?.(event.target.value);
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
                        <div
                            className="flex flex-row justify-center items-center w-40 h-9 bg-input-surface rounded-xl border border-brand px-3 overflow-hidden"
                        >
                            <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={100}
                                step="any"
                                value={inputValue}
                                placeholder="0"
                                disabled={disabled}
                                aria-label={`Tu porcentaje de propiedad`}
                                onChange={handleInputChange}
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
