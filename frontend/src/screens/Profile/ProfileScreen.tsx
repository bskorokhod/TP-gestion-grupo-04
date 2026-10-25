import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation } from "wouter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCheck, faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";

import { CommonLayout } from "@/components/CommonLayout/CommonLayout.tsx";
import { CardActionButton } from "@/components/ui/CardActionButton.tsx";
import { UserIcon } from "@/components/Icons.tsx";
import { useGetUserProfile, useUpdateEmail, useUpdatePhoto } from "@/services/UserServices.ts";
import { uploadAvatar } from "@/lib/supabase.ts";
import { EmailSchema } from "@/models/User.ts";
import { useFormToasts } from "@/hooks/useFormToasts.ts";
import type { BackendError } from "@/hooks/useToast.ts";
import { GROUPS_PATH } from "@/constants/routes.ts";

/**
 * Foto y correo quedan en estado local ("staged") hasta que se toca Guardar: nada se persiste
 * en la cuenta hasta ese momento. Cancelar descarta todo lo pendiente (incluida una edición de
 * correo a medio escribir) y vuelve a "Mis grupos" sin tocar el backend.
 */
export function ProfileScreen() {
    const [, navigate] = useLocation();
    const { showApiError, showSuccessToast, showErrorToast } = useFormToasts();

    const profileQuery = useGetUserProfile();
    const profile = profileQuery.data;

    const updatePhoto = useUpdatePhoto();
    const updateEmail = useUpdateEmail();
    const isSaving = updatePhoto.isPending || updateEmail.isPending;

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Foto pendiente de guardar: se mantiene el File (para subirlo recién al guardar) y una preview local.
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

    // Correo pendiente de guardar. null = sin cambios locales todavía (se muestra profile.email).
    const [emailOverride, setEmailOverride] = useState<string | null>(null);
    const email = emailOverride ?? profile?.email ?? "";

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [emailDraft, setEmailDraft] = useState("");

    // Al desmontar o reemplazar la preview, liberar el object URL para no filtrar memoria.
    useEffect(() => {
        return () => {
            if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
        };
    }, [photoPreviewUrl]);

    const displayedPhotoUrl = photoPreviewUrl ?? profile?.photoUrl ?? null;

    function clearPendingPhoto() {
        setPhotoPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setPhotoFile(null);
    }

    function handlePhotoFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setPhotoPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setPhotoFile(file);
    }

    function startEditingEmail() {
        setEmailDraft(email);
        setIsEditingEmail(true);
    }

    function cancelEditingEmail() {
        setIsEditingEmail(false);
    }

    const emailValidation = EmailSchema.safeParse({ email: emailDraft });
    const isEmailDraftDirty = emailDraft.trim() !== email;
    const canConfirmEmailEdit = emailValidation.success && isEmailDraftDirty && !isSaving;

    function confirmEditingEmail() {
        if (!canConfirmEmailEdit || !emailValidation.success) return;
        // Solo queda en estado local: no se llama al backend hasta tocar Guardar.
        setEmailOverride(emailValidation.data.email);
        setIsEditingEmail(false);
    }

    function handleEmailKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            event.preventDefault();
            confirmEditingEmail();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelEditingEmail();
        }
    }

    function handleCancel() {
        setEmailOverride(null);
        setIsEditingEmail(false);
        clearPendingPhoto();
        navigate(GROUPS_PATH);
    }

    async function handleSave() {
        if (!profile || isSaving) return;

        let emailToSave = email;
        if (isEditingEmail) {
            const validation = EmailSchema.safeParse({ email: emailDraft });
            if (!validation.success) {
                showErrorToast("Correo inválido", validation.error.issues[0]?.message ?? "Revisá el correo ingresado");
                return;
            }
            emailToSave = validation.data.email;
            setEmailOverride(emailToSave);
            setIsEditingEmail(false);
        }

        const emailChanged = emailToSave !== profile.email;
        if (!photoFile && !emailChanged) {
            navigate(GROUPS_PATH);
            return;
        }

        try {
            if (photoFile) {
                const url = await uploadAvatar(photoFile, profile.id);
                await updatePhoto.mutateAsync({ newUrl: { newUrl: url } });
                clearPendingPhoto();
            }
            if (emailChanged) {
                await updateEmail.mutateAsync({ email: emailToSave });
            }
            showSuccessToast("Perfil actualizado", "Tus cambios se guardaron correctamente.");
            navigate(GROUPS_PATH);
        } catch (error) {
            showApiError(error as BackendError, "No se pudieron guardar los cambios");
        }
    }

    return (
        <CommonLayout className="login-backdrop flex min-h-screen flex-col">
            <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
                <section
                    className="w-full max-w-xl rounded-3xl bg-panel px-7 py-8 shadow-panel sm:px-9 sm:py-10"
                    aria-labelledby="profile-title"
                >
                    <h1 id="profile-title" className="font-display text-3xl font-extrabold leading-none text-ink">
                        Modificar perfil
                    </h1>
                    <p className="mt-3 text-base text-warm-muted">
                        Estos datos son de tu cuenta: se aplican en todos tus grupos. Los cambios se guardan recién
                        al tocar «Guardar».
                    </p>

                    {profileQuery.isLoading && (
                        <p role="status" className="mt-10 text-base text-warm-muted">
                            Cargando perfil...
                        </p>
                    )}

                    {profileQuery.isError && (
                        <p role="alert" className="mt-10 text-base font-medium text-group-danger">
                            No pudimos cargar tu perfil.
                        </p>
                    )}

                    {profile && (
                        <>
                            <div className="mt-10 flex flex-col items-center">
                                <div className="relative size-28">
                                    <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border border-field bg-group-paper">
                                        {displayedPhotoUrl ? (
                                            <img
                                                src={displayedPhotoUrl}
                                                alt="Foto de perfil"
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="size-14 text-warm-muted" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSaving}
                                        title="Cambiar foto de perfil"
                                        aria-label="Cambiar foto de perfil"
                                        className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-panel bg-brand text-brand-foreground shadow-panel transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <FontAwesomeIcon icon={faCamera} className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoFileChange}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSaving}
                                    className="mt-3 cursor-pointer text-sm font-semibold text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cambiar foto
                                </button>
                            </div>

                            <div className="mt-10">
                                <p className="text-base font-medium text-ink">Correo electrónico</p>

                                {isEditingEmail ? (
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            type="email"
                                            value={emailDraft}
                                            autoFocus
                                            disabled={isSaving}
                                            aria-label="Editar tu correo electrónico"
                                            aria-invalid={!emailValidation.success}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmailDraft(event.target.value)}
                                            onKeyDown={handleEmailKeyDown}
                                            className={`h-14 min-w-0 flex-1 rounded-xl border bg-input-surface px-5 text-base text-ink outline-none transition-shadow focus:ring-2 focus:ring-brand/25 ${emailValidation.success ? "border-field" : "border-group-danger"}`}
                                        />
                                        <CardActionButton
                                            icon={faCheck}
                                            label="Confirmar"
                                            tone="brand"
                                            onClick={confirmEditingEmail}
                                            disabledReason={!canConfirmEmailEdit ? "Ingresá un correo válido y distinto al actual" : undefined}
                                        />
                                        <CardActionButton
                                            icon={faXmark}
                                            label="Cancelar"
                                            tone="danger"
                                            onClick={cancelEditingEmail}
                                            disabledReason={isSaving ? "Guardando..." : undefined}
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-3 flex items-center gap-2">
                                        <p className="min-w-0 truncate text-base text-ink">{email}</p>
                                        <CardActionButton
                                            icon={faPenToSquare}
                                            label="Editar tu correo"
                                            tone="brand"
                                            onClick={startEditingEmail}
                                            disabledReason={isSaving ? "Guardando..." : undefined}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="rounded-full border border-field bg-panel px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-group-paper disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </CommonLayout>
    );
}

export default ProfileScreen;
