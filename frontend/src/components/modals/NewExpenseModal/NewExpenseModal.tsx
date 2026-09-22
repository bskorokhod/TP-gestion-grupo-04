import {useState} from "react";

import {ModalShell} from "@/components/modals/ModalShell";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {RECEIPTS_BUCKET_NAME, uploadToBucket} from "@/lib/supabase.ts";
import type {Member, MemberColor} from "@/models/Group.ts";
import {useGetGroupMembers} from "@/services/GroupServices.ts";
import {useCreateExpense} from "@/services/ExpenseServices.ts";

import {Field} from "./Field";
import {FileDropzone} from "./FileDropzone";
import {MemberPicker} from "./MemberPicker";
import {ChipButton, PersonChip, type ChipTone} from "./PersonChip";
import {SplitMethodSelector, type SplitMethod} from "./SplitMethodSelector";
import {TextArea, TextInput} from "./TextInput";

// PersonChip solo entiende 3 tonos; MemberColor tiene 8. Agrupamos por familia de color.
const COLOR_TO_TONE: Record<MemberColor, ChipTone> = {
  GREEN: "green",
  LIGHT_BLUE: "green",
  YELLOW: "amber",
  ORANGE: "amber",
  RED: "primary",
  BLUE: "primary",
  PURPLE: "primary",
  PINK: "primary",
};

export interface NewExpenseModalProps {
  groupId: number;
  onClose?: () => void;
}

export function NewExpenseModal({
                                  groupId,
                                  onClose,
                                }: NewExpenseModalProps) {
  const {data: members = []} = useGetGroupMembers(groupId, "ACTIVE");
  const createExpense = useCreateExpense(groupId);
  const {showSchemaError, showApiError, showSuccessToast} = useFormToasts();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("PROPORTIONAL");

  const [participantIds, setParticipantIds] = useState<Set<number>>(new Set());
  const [responsibleId, setResponsibleId] = useState<number | null>(null);

  const [isParticipantPickerOpen, setIsParticipantPickerOpen] = useState(false);
  const [isResponsiblePickerOpen, setIsResponsiblePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const responsible = members.find((member) => member.id === responsibleId) ?? null;
  // El responsable no puede además figurar como deudor de su propio gasto.
  const assignableMembers = members.filter((member) => member.id !== responsibleId);
  const participants = assignableMembers.filter((member) => participantIds.has(member.id));
  const pickableParticipants = assignableMembers.filter((member) => !participantIds.has(member.id));

  const addParticipant = (member: Member) => {
    setParticipantIds((current) => new Set(current).add(member.id));
    setIsParticipantPickerOpen(false);
  };

  const removeParticipant = (memberId: number) => {
    setParticipantIds((current) => {
      const next = new Set(current);
      next.delete(memberId);
      return next;
    });
  };

  const addAllMembers = () => {
    setParticipantIds(new Set(assignableMembers.map((member) => member.id)));
  };

  const selectResponsible = (member: Member) => {
    setResponsibleId(member.id);
    // Si ya estaba asignado como deudor, deja de tener sentido: lo sacamos de la lista.
    setParticipantIds((current) => {
      if (!current.has(member.id)) return current;
      const next = new Set(current);
      next.delete(member.id);
      return next;
    });
    setIsResponsiblePickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showSchemaError("El título del gasto es obligatorio");
      return;
    }

    const parsedAmount = Number(amount.replace(",", "."));
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showSchemaError("Ingresá un monto válido, mayor a cero");
      return;
    }

    if (!file) {
      showSchemaError("El comprobante (imagen o PDF) es obligatorio");
      return;
    }

    if (!responsible) {
      showSchemaError("Elegí quién está a cargo del gasto");
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptUrl = await uploadToBucket(RECEIPTS_BUCKET_NAME, file);

      await createExpense.mutateAsync({
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        totalAmount: parsedAmount,
        creditorId: responsible.id,
        splitMethod,
        participants: participants.map((member) => ({memberId: member.id})),
        receiptUrl,
      });

      showSuccessToast("Gasto registrado");
      onClose?.();
    } catch (error) {
      showApiError(error as BackendError, "No se pudo registrar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Nuevo gasto"
      submitLabel={isSubmitting ? "Guardando..." : "Guardar gasto"}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <Field
        label="Título del gasto"
        htmlFor="expense-title"
      >
        <TextInput
          id="expense-title"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
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
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Ej. Filtración detectada en el dormitorio principal"
        />
      </Field>

      <Field
        label="Monto del gasto"
        htmlFor="expense-amount"
      >
        <TextInput
          id="expense-amount"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          inputMode="decimal"
          placeholder="$ 0"
        />
      </Field>

      <Field
        label="Ticket o factura"
        hint="Arrastrá el archivo o elegilo desde tu dispositivo"
      >
        <FileDropzone
          file={file}
          onFileChange={setFile}
        />
      </Field>

      <Field
        label="Definir reparto"
        hint="Cómo se divide el gasto entre las personas asignadas"
      >
        <SplitMethodSelector
          value={splitMethod}
          onChange={setSplitMethod}
        />
      </Field>

      <Field
        label="Personas a quienes se les asigna"
        hint="Se agregan de a una, según los miembros del grupo; puede no haber ninguna"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {participants.map((member) => (
              <PersonChip
                key={member.id}
                initials={member.nickname.slice(0, 2).toUpperCase()}
                name={member.nickname}
                tone={COLOR_TO_TONE[member.color]}
                onRemove={() => removeParticipant(member.id)}
              />
            ))}

            <ChipButton
              label="+ Agregar persona"
              onClick={() => setIsParticipantPickerOpen((open) => !open)}
            />

            {assignableMembers.length > 0 ? (
              <ChipButton
                label="Agregar todos"
                onClick={addAllMembers}
              />
            ) : null}
          </div>

          {isParticipantPickerOpen ? (
            <MemberPicker
              members={pickableParticipants}
              onSelect={addParticipant}
              onClose={() => setIsParticipantPickerOpen(false)}
              emptyLabel="No quedan miembros activos por agregar"
            />
          ) : null}
        </div>
      </Field>

      <Field
        label="Persona a cargo del gasto"
        hint="A quién se le debe la plata — obligatorio, solo una persona"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {responsible ? (
              <PersonChip
                initials={responsible.nickname.slice(0, 2).toUpperCase()}
                name={responsible.nickname}
                tone={COLOR_TO_TONE[responsible.color]}
                onRemove={() => setResponsibleId(null)}
              />
            ) : null}

            <ChipButton
              label={
                responsible
                  ? "Cambiar persona"
                  : "Elegir persona"
              }
              onClick={() => setIsResponsiblePickerOpen((open) => !open)}
            />
          </div>

          {isResponsiblePickerOpen ? (
            <MemberPicker
              members={members.filter((member) => member.id !== responsibleId)}
              onSelect={selectResponsible}
              onClose={() => setIsResponsiblePickerOpen(false)}
              emptyLabel="No hay miembros activos en el grupo"
            />
          ) : null}
        </div>
      </Field>
    </ModalShell>
  );
}

export default NewExpenseModal;
