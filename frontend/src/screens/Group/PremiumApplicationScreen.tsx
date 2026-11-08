import {type FormEvent, useState} from "react";
import {Redirect, useLocation} from "wouter";
import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import {TextInput} from "@/components/Forms/TextInput.tsx";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {PremiumSubscribeSchema} from "@/models/Group.ts";
import {getTrialOffer, type TrialOffer} from "@/lib/premium.ts";
import {useGetPremiumEligibility, useSubscribeGroupPremium} from "@/services/GroupServices.ts";
import {groupConfigPath, GROUPS_PATH} from "@/constants/routes.ts";

const TRIAL_DAYS = 7;

const TRIAL_OFFER_COPY: Record<TrialOffer, { title: string; description: string; submitLabel: string }> = {
    checking: {
        title: "Plan premium",
        description: "Verificando si te corresponde la prueba gratuita...",
        submitLabel: "Verificando...",
    },
    available: {
        title: "Comenzar prueba premium",
        description: `Probá las funciones premium gratis durante ${TRIAL_DAYS} días. Después se debitará automáticamente el plan en la tarjeta que registres.`,
        submitLabel: "Comenzar prueba gratuita",
    },
    unavailable: {
        title: "Activar plan premium",
        description: "La prueba gratuita ya se usó (en tu cuenta o en este grupo), así que el plan se debitará en la tarjeta que registres desde que lo actives.",
        submitLabel: "Activar plan premium",
    },
    unknown: {
        title: "Plan premium",
        description: "No pudimos verificar si te corresponde la prueba gratuita. Si te corresponde se aplicará al activar el plan; si no, el plan se debitará en la tarjeta que registres desde que lo actives.",
        submitLabel: "Activar plan premium",
    },
};

export function PremiumApplicationScreen() {
    const group = useCurrentGroup();
    const [, navigate] = useLocation();
    const {showSuccessToast, showSchemaError, showApiError} = useFormToasts();
    const subscribe = useSubscribeGroupPremium(group.id);
    const eligibility = useGetPremiumEligibility(group.id);
    const trialOffer = getTrialOffer(eligibility);
    const copy = TRIAL_OFFER_COPY[trialOffer];
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiration, setExpiration] = useState("");
    const [securityCode, setSecurityCode] = useState("");

    // Un grupo que ya es premium no tiene nada que contratar (el backend respondería 409).
    if (group.isPremium) {
        return <Redirect href={groupConfigPath(group.joinCode)} replace/>;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const parsed = PremiumSubscribeSchema.safeParse({cardholderName, cardNumber, expiration, securityCode});
        if (!parsed.success) {
            showSchemaError(parsed.error.issues[0].message);
            return;
        }

        try {
            const subscription = await subscribe.mutateAsync(parsed.data);
            if (subscription.trial) {
                showSuccessToast(
                    "Prueba premium iniciada",
                    `No se realizará ningún débito durante los primeros ${TRIAL_DAYS} días. Luego se cobrará automáticamente en la tarjeta registrada.`,
                );
            } else {
                // La prueba gratuita ya se usó (en tu cuenta o en este grupo): la suscripción arranca sin período de prueba.
                showSuccessToast(
                    "Plan premium activado",
                    `Tu suscripción mensual quedó registrada con la tarjeta terminada en ${subscription.cardLast4}. La prueba gratuita ya se usó (en tu cuenta o en este grupo), por eso no hay período de prueba.`,
                );
            }
            navigate(groupConfigPath(group.joinCode));
        } catch (error) {
            showApiError(error as BackendError, "No se pudo activar el plan premium");
        }
    }

    return (
        <CommonLayout className="login-backdrop flex min-h-screen flex-col">
            <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
                <form
                    className="w-full max-w-xl rounded-3xl bg-panel px-7 py-8 shadow-panel sm:px-9 sm:py-10"
                    onSubmit={handleSubmit}
                >
                    <div className="flex items-center gap-3">
                        <h1 className="font-display text-3xl font-extrabold leading-none text-ink">
                            {copy.title}
                        </h1>
                    </div>
                    <p className="mt-3 text-base text-warm-muted">
                        {copy.description}
                    </p>

                    <div className="mt-8 flex flex-col gap-6">
                        <TextField
                            id="premium-group-name"
                            label="Grupo"
                            value={group.name}
                            readOnly
                        />
                        <TextField
                            id="premium-cardholder-name"
                            label="Nombre del titular"
                            value={cardholderName}
                            onChange={(event) => setCardholderName(event.target.value)}
                            autoComplete="cc-name"
                            required
                        />
                        <div>
                            <label htmlFor="premium-card-number" className="text-base font-medium text-ink">Número de tarjeta</label>
                            <TextInput
                                id="premium-card-number"
                                value={cardNumber}
                                onChange={(event) => setCardNumber(event.target.value)}
                                inputMode="numeric"
                                autoComplete="cc-number"
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="premium-card-expiration" className="text-base font-medium text-ink">Vencimiento</label>
                                <TextInput
                                    id="premium-card-expiration"
                                    value={expiration}
                                    onChange={(event) => setExpiration(event.target.value)}
                                    inputMode="numeric"
                                    autoComplete="cc-exp"
                                    placeholder="MM/AA"
                                    maxLength={5}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="premium-card-cvv" className="text-base font-medium text-ink">Código de seguridad</label>
                                <TextInput
                                    id="premium-card-cvv"
                                    value={securityCode}
                                    onChange={(event) => setSecurityCode(event.target.value)}
                                    inputMode="numeric"
                                    autoComplete="cc-csc"
                                    placeholder="123"
                                    maxLength={4}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="modalSecondary" size="modal" onClick={() => navigate(GROUPS_PATH)}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="default" size="modal" disabled={subscribe.isPending || trialOffer === "checking"}>
                            {subscribe.isPending ? "Procesando..." : copy.submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </CommonLayout>
    );
}
