import {useState} from "react";

import {ModalShell} from "@/components/modals/ModalShell";

import {Field} from "./Field";
import {FileDropzone} from "./FileDropzone";
import {ChipButton, PersonChip, type ChipTone} from "./PersonChip";
import {
  SplitMethodSelector,
  type SplitMethod,
} from "./SplitMethodSelector";
import {TextArea, TextInput} from "./TextInput";

interface Person {
  id: string;
  name: string;
  initials: string;
  tone: ChipTone;
}

const initialAssignees: Person[] = [
  {
    id: "rocio",
    name: "Rocío",
    initials: "R",
    tone: "green",
  },
  {
    id: "pablo",
    name: "Pablo",
    initials: "P",
    tone: "amber",
  },
];

const initialResponsible: Person = {
  id: "nachito",
  name: "Nachito",
  initials: "Yo",
  tone: "primary",
};

export interface NewExpense {
  title: string;
  reason: string;
  amount: string;
  file: File | null;
  splitMethod: SplitMethod;
  assignees: Person[];
  responsible: Person | null;
}

export interface NewExpenseModalProps {
  onClose?: () => void;
  onSave?: (expense: NewExpense) => void;
}

export function NewExpenseModal({
                                  onClose,
                                  onSave,
                                }: NewExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const [assignees, setAssignees] =
    useState<Person[]>(initialAssignees);

  const [responsible, setResponsible] =
    useState<Person | null>(initialResponsible);

  const [splitMethod, setSplitMethod] =
    useState<SplitMethod>("proportional");

  const [file, setFile] =
    useState<File | null>(null);

  const handleSubmit = () => {
    onSave?.({
      title,
      reason,
      amount,
      file,
      splitMethod,
      assignees,
      responsible,
    });
  };

  return (
    <ModalShell
      title="Nuevo gasto"
      submitLabel="Guardar gasto"
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
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
      >
        <TextArea
          id="expense-reason"
          value={reason}
          onChange={(event) =>
            setReason(event.target.value)
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
        hint="Se agregan de a una, según los miembros del grupo"
      >
        <div className="flex flex-wrap items-center gap-2">
          {assignees.map((person) => (
            <PersonChip
              key={person.id}
              initials={person.initials}
              name={person.name}
              tone={person.tone}
              onRemove={() =>
                setAssignees((current) =>
                  current.filter(
                    (item) =>
                      item.id !== person.id,
                  ),
                )
              }
            />
          ))}

          <ChipButton label="+ Agregar persona" />
        </div>
      </Field>

      <Field
        label="Persona a cargo del gasto"
        hint="A quién se le debe la plata — solo una persona"
      >
        <div className="flex flex-wrap items-center gap-2">
          {responsible ? (
            <PersonChip
              initials={responsible.initials}
              name={responsible.name}
              tone={responsible.tone}
              onRemove={() =>
                setResponsible(null)
              }
            />
          ) : null}

          <ChipButton
            label={
              responsible
                ? "Cambiar persona"
                : "Elegir persona"
            }
          />
        </div>
      </Field>
    </ModalShell>
  );
}

export default NewExpenseModal;