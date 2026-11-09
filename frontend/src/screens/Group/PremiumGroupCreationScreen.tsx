import {type FormEvent, useState} from "react";
import {Redirect, useLocation} from "wouter";

import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import {TextInput} from "@/components/Forms/TextInput.tsx";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {PremiumSubscribeSchema} from "@/models/Group.ts";
import {clearPremiumGroupDraft, readPremiumGroupDraft, getTrialOffer} from "@/lib/premium.ts";
import {groupReservationsPath, GROUPS_PATH} from "@/constants/routes.ts";
import {useCreatePremiumGroup, useGetNewPremiumGroupEligibility} from "@/services/GroupServices.ts";

export function PremiumGroupCreationScreen() {
    const draft = readPremiumGroupDraft();
    const [, navigate] = useLocation();
    const {showSuccessToast, showSchemaError, showApiError} = useFormToasts();
    const eligibility = useGetNewPremiumGroupEligibility();
    const createGroup = useCreatePremiumGroup();
    const offer = getTrialOffer(eligibility);
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiration, setExpiration] = useState("");
    const [securityCode, setSecurityCode] = useState("");

    if (!draft) return <Redirect href={GROUPS_PATH} replace/>;
    const groupDraft = draft;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const parsed = PremiumSubscribeSchema.safeParse({cardholderName, cardNumber, expiration, securityCode});
        if (!parsed.success) {
            showSchemaError(parsed.error.issues[0]?.message ?? "Revisá los datos de la tarjeta");
            return;
        }
        try {
            const group = await createGroup.mutateAsync({group: groupDraft, payment: parsed.data});
            clearPremiumGroupDraft();
            showSuccessToast(
                offer === "available" ? "Prueba premium iniciada" : "Grupo premium creado",
                offer === "available"
                    ? "Tu grupo tiene 7 días de prueba gratuita."
                    : "El plan premium quedó activado.",
            );
            navigate(groupReservationsPath(group.joinCode));
        } catch (error) {
            showApiError(error as BackendError, "No se pudo crear el grupo premium");
        }
    }

    return (
        <CommonLayout className="login-backdrop flex min-h-screen flex-col">
            <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
                <form className="w-full max-w-xl rounded-3xl bg-panel px-7 py-8 shadow-panel sm:px-9 sm:py-10" onSubmit={handleSubmit}>
                    <h1 className="font-display text-3xl font-extrabold leading-none text-ink">Crear grupo premium</h1>
                    <p className="mt-3 text-base text-warm-muted">
                        {offer === "available"
                            ? "Probá Premium gratis durante 7 días. Después se cobrará automáticamente."
                            : "Completá el pago para crear tu grupo con las configuraciones premium."}
                    </p>
                    <div className="mt-8 flex flex-col gap-6">
                        <TextField id="premium-new-group-name" label="Grupo" value={groupDraft.name} readOnly/>
                        <TextField id="premium-new-cardholder" label="Nombre del titular" value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} autoComplete="cc-name" required/>
                        <div>
                            <label htmlFor="premium-new-card-number" className="text-base font-medium text-ink">Número de tarjeta</label>
                            <TextInput id="premium-new-card-number" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" maxLength={19} required/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="premium-new-expiration" className="text-base font-medium text-ink">Vencimiento</label>
                                <TextInput id="premium-new-expiration" value={expiration} onChange={(event) => setExpiration(event.target.value)} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5} required/>
                            </div>
                            <div>
                                <label htmlFor="premium-new-security" className="text-base font-medium text-ink">Código de seguridad</label>
                                <TextInput id="premium-new-security" value={securityCode} onChange={(event) => setSecurityCode(event.target.value)} inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} required/>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="modalSecondary" size="modal" onClick={() => { clearPremiumGroupDraft(); navigate(GROUPS_PATH); }}>Cancelar</Button>
                        <Button type="submit" variant="default" size="modal" disabled={createGroup.isPending || offer === "checking"}>
                            {createGroup.isPending ? "Procesando..." : offer === "available" ? "Comenzar prueba gratuita" : "Crear grupo premium"}
                        </Button>
                    </div>
                </form>
            </div>
        </CommonLayout>
    );
}
