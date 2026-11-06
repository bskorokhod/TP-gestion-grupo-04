import { type KeyboardEvent, useEffect, useState } from "react";
import type { z } from "zod";

interface UseInlineEditOptions<T> {
    initialValue: T;
    schema: z.ZodType<T>;
    onSave?: (value: T) => Promise<void>;
    canEdit: boolean;
    isSaving?: boolean;
}

export function useInlineEdit<T extends string>({
                                                    initialValue,
                                                    schema,
                                                    onSave,
                                                    canEdit,
                                                    isSaving = false,
                                                }: UseInlineEditOptions<T>) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(initialValue);

    useEffect(() => {
        if (!isEditing) setDraft(initialValue);
    }, [initialValue, isEditing]);

    const validation = schema.safeParse(draft);
    const isDirty = draft.trim() !== initialValue;
    const canConfirm = canEdit && validation.success && isDirty && !isSaving;

    function startEditing() {
        setDraft(initialValue);
        setIsEditing(true);
    }

    function cancelEditing() {
        setDraft(initialValue);
        setIsEditing(false);
    }

    async function confirmEditing() {
        if (!canConfirm || !validation.success || !onSave) return;
        try {
            await onSave(validation.data);
            setIsEditing(false);
        } catch {
            // El manejo de error (toast) se realiza en el caller.
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            event.preventDefault();
            void confirmEditing();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelEditing();
        }
    }

    return {
        isEditing,
        draft,
        setDraft,
        validation,
        canConfirm,
        startEditing,
        cancelEditing,
        confirmEditing,
        handleKeyDown,
    };
}
