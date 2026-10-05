import { useState } from "react";

import type { SplitMethod } from "@/models/Expense.ts";

export interface ExpenseFormInitialValues {
    readonly title: string;
    readonly description: string;
    readonly amount: string;
    readonly splitMethod: SplitMethod;
    readonly participantIds: ReadonlySet<number>;
}

/** Estado de los campos de un gasto, compartido por el modal de alta y el de modificación. */
export interface ExpenseForm {
    readonly title: string;
    readonly setTitle: (title: string) => void;
    readonly description: string;
    readonly setDescription: (description: string) => void;
    readonly amount: string;
    readonly setAmount: (amount: string) => void;
    readonly file: File | null;
    readonly setFile: (file: File | null) => void;
    readonly splitMethod: SplitMethod;
    readonly setSplitMethod: (splitMethod: SplitMethod) => void;
    readonly participantIds: ReadonlySet<number>;
    readonly addParticipant: (memberId: number) => void;
    readonly removeParticipant: (memberId: number) => void;
    readonly selectParticipants: (memberIds: readonly number[]) => void;
}

export function useExpenseForm(initial: ExpenseFormInitialValues): ExpenseForm {
    const [title, setTitle] = useState<string>(initial.title);
    const [description, setDescription] = useState<string>(initial.description);
    const [amount, setAmount] = useState<string>(initial.amount);
    const [file, setFile] = useState<File | null>(null);
    const [splitMethod, setSplitMethod] = useState<SplitMethod>(initial.splitMethod);
    const [participantIds, setParticipantIds] = useState<ReadonlySet<number>>(initial.participantIds);

    const addParticipant = (memberId: number): void => {
        setParticipantIds((current) => new Set(current).add(memberId));
    };

    const removeParticipant = (memberId: number): void => {
        setParticipantIds((current) => {
            const next = new Set(current);
            next.delete(memberId);
            return next;
        });
    };

    const selectParticipants = (memberIds: readonly number[]): void => {
        setParticipantIds(new Set(memberIds));
    };

    return {
        title,
        setTitle,
        description,
        setDescription,
        amount,
        setAmount,
        file,
        setFile,
        splitMethod,
        setSplitMethod,
        participantIds,
        addParticipant,
        removeParticipant,
        selectParticipants,
    };
}
