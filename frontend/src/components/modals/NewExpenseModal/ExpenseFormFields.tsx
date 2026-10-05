import { useState, type ReactElement, type ReactNode } from "react";

import { Field } from "@/components/Forms/Field";
import { TextArea, TextInput } from "@/components/Forms/TextInput";
import type { Member } from "@/models/Group.ts";

import { FileDropzone } from "./FileDropzone";
import { MemberPicker } from "./MemberPicker";
import { ChipButton, PersonChip } from "./PersonChip";
import { SplitMethodSelector } from "./SplitMethodSelector";
import type { ExpenseForm } from "./useExpenseForm";

/** Textos que cambian según se esté registrando un gasto propio o modificando uno existente. */
export interface ExpenseFormCopy {
    readonly receiptHint: string;
    readonly participantsHint: string;
    readonly creditorHint: string;
    readonly equalSplitNotice: string;
}

export interface ExpenseFormFieldsProps {
    readonly form: ExpenseForm;
    /** Miembros activos que se pueden asignar como deudores: nunca incluye a quien está a cargo del gasto. */
    readonly assignableMembers: readonly Member[];
    /** Quien queda a cargo del gasto, o sea a quien se le debe. */
    readonly creditor?: Pick<Member, "nickname" | "color" | "photoUrl">;
    /** En un grupo EQUAL no existe el reparto proporcional: se oculta el selector. */
    readonly isEqualDistribution: boolean;
    readonly amountNotice?: ReactNode;
    readonly copy: ExpenseFormCopy;
}

export function ExpenseFormFields({
    form,
    assignableMembers,
    creditor,
    isEqualDistribution,
    amountNotice,
    copy,
}: ExpenseFormFieldsProps): ReactElement {
    const [isParticipantPickerOpen, setIsParticipantPickerOpen] = useState<boolean>(false);

    const participants = assignableMembers.filter((member) => form.participantIds.has(member.id));
    const pickableParticipants = assignableMembers.filter((member) => !form.participantIds.has(member.id));

    const handlePickParticipant = (member: Member): void => {
        form.addParticipant(member.id);
        setIsParticipantPickerOpen(false);
    };

    return (
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div className="flex flex-col gap-5">
                <Field label="Título del gasto" htmlFor="expense-title">
                    <TextInput
                        id="expense-title"
                        value={form.title}
                        onChange={(event) => form.setTitle(event.target.value)}
                        placeholder="Ej. Reparación de techo"
                    />
                </Field>

                <Field
                    label="Motivo del gasto"
                    htmlFor="expense-reason"
                    hint="Opcional"
                >
                    <TextArea
                        id="expense-reason"
                        value={form.description}
                        onChange={(event) => form.setDescription(event.target.value)}
                        placeholder="Ej. Filtración detectada en el dormitorio principal"
                    />
                </Field>

                <Field label="Monto del gasto" htmlFor="expense-amount">
                    <TextInput
                        id="expense-amount"
                        value={form.amount}
                        onChange={(event) => form.setAmount(event.target.value)}
                        inputMode="decimal"
                        placeholder="$ 0"
                    />
                    {amountNotice}
                </Field>

                <Field
                    label="Ticket o factura"
                    hint={copy.receiptHint}
                >
                    <FileDropzone file={form.file} onFileChange={form.setFile} />
                </Field>
            </div>

            <div className="flex flex-col gap-5">
                <Field
                    label="Definir reparto"
                    hint="Cómo se divide el gasto entre las personas asignadas"
                >
                    {isEqualDistribution ? (
                        <p className="text-sm text-modal-ink">{copy.equalSplitNotice}</p>
                    ) : (
                        <SplitMethodSelector value={form.splitMethod} onChange={form.setSplitMethod} />
                    )}
                </Field>

                <Field
                    label="Personas a quienes se les asigna"
                    hint={copy.participantsHint}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {participants.map((member) => (
                                <PersonChip
                                    key={member.id}
                                    name={member.nickname}
                                    color={member.color}
                                    photoUrl={member.photoUrl}
                                    onRemove={() => form.removeParticipant(member.id)}
                                />
                            ))}

                            <ChipButton
                                label="+ Agregar persona"
                                onClick={() => setIsParticipantPickerOpen((open) => !open)}
                            />

                            {assignableMembers.length > 0 ? (
                                <ChipButton
                                    label="Agregar todos"
                                    onClick={() => form.selectParticipants(assignableMembers.map((member) => member.id))}
                                />
                            ) : null}
                        </div>

                        {isParticipantPickerOpen ? (
                            <MemberPicker
                                members={pickableParticipants}
                                onSelect={handlePickParticipant}
                                onClose={() => setIsParticipantPickerOpen(false)}
                                emptyLabel="No quedan miembros activos por agregar"
                            />
                        ) : null}
                    </div>
                </Field>

                <Field
                    label="Persona a cargo del gasto"
                    hint={copy.creditorHint}
                >
                    {creditor ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <PersonChip name={creditor.nickname} color={creditor.color} photoUrl={creditor.photoUrl} />
                        </div>
                    ) : null}
                </Field>
            </div>
        </div>
    );
}
