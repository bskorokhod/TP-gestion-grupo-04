import { useState } from "react";

import { Button } from "@/components/Button.tsx";
import { Field } from "@/components/Forms/Field.tsx";
import { TextArea } from "@/components/Forms/TextInput.tsx";
import { formatDate } from "@/lib/dates.ts";
import type { Reservation } from "@/models/Reservation.ts";

interface ReservationDetailProps {
    readonly reservation: Reservation;
    readonly isOwn: boolean;
    /** Motivo de la cancelación pendiente de votación; `undefined` si no hay ninguna. */
    readonly pendingReason?: string;
    readonly onCancelOwn: () => void;
    readonly onRequestCancellation: (reason: string) => void;
    readonly onClose: () => void;
}

export function ReservationDetail({
    reservation,
    isOwn,
    pendingReason,
    onCancelOwn,
    onRequestCancellation,
    onClose,
}: ReservationDetailProps) {
    const [reason, setReason] = useState("");
    const reasonId = `cancellation-reason-${reservation.id}`;

    return (
        <section className="border-t border-brand/10 pt-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-group-heading">Detalle de reserva</h3>
                    <p className="mt-1 text-xs text-group-muted">
                        {reservation.memberNickname} · {formatDate(reservation.startDate)} al {formatDate(reservation.endDate)}
                    </p>
                </div>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={onClose}>
                    Cerrar
                </Button>
            </div>

            {pendingReason !== undefined ? (
                <p className="mt-3 rounded-lg bg-group-danger-soft px-3 py-2 text-xs text-group-danger">
                    Cancelación pendiente de votación del grupo.
                    {pendingReason && <span className="mt-1 block">Motivo: {pendingReason}</span>}
                </p>
            ) : isOwn ? (
                <Button variant="dangerOutline" size="sm" className="mt-3 rounded-full" onClick={onCancelOwn}>
                    Cancelar mi reserva
                </Button>
            ) : (
                <form
                    className="mt-4 space-y-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onRequestCancellation(reason);
                    }}
                >
                    <Field label="¿Por qué querés cancelar esta reserva?" htmlFor={reasonId}>
                        <TextArea
                            id={reasonId}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Explicá el motivo para que el grupo pueda evaluarlo"
                            maxLength={500}
                            required
                            className="text-xs"
                        />
                    </Field>
                    <Button
                        type="submit"
                        variant="dangerOutline"
                        size="sm"
                        className="rounded-full"
                        disabled={!reason.trim()}
                    >
                        Solicitar cancelación al grupo
                    </Button>
                </form>
            )}
        </section>
    );
}
