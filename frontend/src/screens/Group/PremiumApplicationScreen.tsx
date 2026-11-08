import {type FormEvent, type ReactNode, useMemo, useState} from "react";
import {useLocation, useSearch} from "wouter";
import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import SelectField from "@/components/Forms/SelectField.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import {TextInput} from "@/components/Forms/TextInput.tsx";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {PremiumSubscribeSchema} from "@/models/Group.ts";
import {getTrialOffer, type TrialOffer} from "@/lib/premium.ts";
import {
    useGetGroups,
    useGetPremiumEligibility,
    useGetPremiumPlan,
    useSubscribeGroupPremium,
} from "@/services/GroupServices.ts";
import {groupConfigPath, GROUPS_PATH} from "@/constants/routes.ts";

interface OfferCopy {
    title: string;
    description: string;
    submitLabel: string;
}

function offerCopy(offer: TrialOffer, trialDays: number): OfferCopy {
    switch (offer) {
        case "checking":
            return {
                title: "Plan premium",
                description: "Verificando si te corresponde la prueba gratuita...",
                submitLabel: "Verificando...",
            };
        case "available":
            return {
                title: "Comenzar prueba premium",
                description: `Probá las funciones premium gratis durante ${trialDays} días. Después se debitará automáticamente el plan en la tarjeta que registres.`,
                submitLabel: "Comenzar prueba gratuita",
            };
        case "unavailable":
            return {
                title: "Activar plan premium",
                description: "La prueba gratuita ya se usó (en tu cuenta o en este grupo), así que el plan se debitará en la tarjeta que registres desde que lo actives.",
                submitLabel: "Activar plan premium",
            };
        case "unknown":
            return {
                title: "Plan premium",
                description: "No pudimos verificar si te corresponde la prueba gratuita. Si te corresponde se aplicará al activar el plan; si no, el plan se debitará en la tarjeta que registres desde que lo actives.",
                submitLabel: "Activar plan premium",
            };
    }
}

/** Mientras no hay grupo elegido no se consulta la elegibilidad, así que no se promete ni se descarta la prueba. */
function noGroupCopy(trialDays: number): OfferCopy {
    return {
        title: "Plan premium",
        description: `Elegí el grupo en el que querés activar Premium. Si te corresponde, tenés ${trialDays} días de prueba gratuita; si no, el plan se debitará en la tarjeta que registres desde que lo actives.`,
        submitLabel: "Activar plan premium",
    };
}

function CenteredMessage({children}: { children: ReactNode }) {
    return (
        <CommonLayout className="login-backdrop flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-10 text-center text-ink sm:px-10">
                {children}
            </div>
        </CommonLayout>
    );
}

export function PremiumApplicationScreen() {
    const [, navigate] = useLocation();
    const search = useSearch();
    const {showSuccessToast, showSchemaError, showApiError} = useFormToasts();
    const plan = useGetPremiumPlan();
    const groups = useGetGroups();
    const [chosenCode, setChosenCode] = useState<string | null>(null);
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiration, setExpiration] = useState("");
    const [securityCode, setSecurityCode] = useState("");

    // Solo se puede activar premium en grupos donde el usuario es miembro activo y que todavía no son premium.
    const eligibleGroups = useMemo(
        () => (groups.data ?? []).filter((group) => !group.isPremium && group.myStatus === "ACTIVE"),
        [groups.data],
    );

    // Preselección opcional (?grupo=ABC-1234-XYZ), por ejemplo desde el modal de contenido premium. Si no es elegible, se ignora.
    const requestedCode = new URLSearchParams(search).get("grupo")?.toUpperCase();
    const selectedCode = chosenCode ?? requestedCode;
    const selectedGroup = eligibleGroups.find((group) => group.joinCode.toUpperCase() === selectedCode?.toUpperCase());

    const subscribe = useSubscribeGroupPremium(selectedGroup?.id ?? 0);
    const eligibility = useGetPremiumEligibility(selectedGroup?.id ?? 0);

    if (plan.isLoading || groups.isLoading) {
        return <CenteredMessage><p>Cargando...</p></CenteredMessage>;
    }

    if (plan.isError || !plan.data || groups.isError) {
        return <CenteredMessage><p>No pudimos cargar la información para activar Premium.</p></CenteredMessage>;
    }

    const trialDays = plan.data.trialDays;

    if (eligibleGroups.length === 0) {
        return (
            <CenteredMessage>
                <p>No tenés grupos en los que puedas activar Premium: todos tus grupos ya son premium o todavía no sos miembro de ninguno.</p>
                <Button type="button" variant="modalSecondary" size="modal" onClick={() => navigate(GROUPS_PATH)}>
                    Ir a mis grupos
                </Button>
            </CenteredMessage>
        );
    }

    const trialOffer = getTrialOffer(eligibility);
    const copy = selectedGroup ? offerCopy(trialOffer, trialDays) : noGroupCopy(trialDays);
    const checking = selectedGroup !== undefined && trialOffer === "checking";

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedGroup) {
            showSchemaError("Elegí el grupo en el que querés activar Premium");
            return;
        }

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
                    `No se realizará ningún débito durante los primeros ${trialDays} días. Luego se cobrará automáticamente en la tarjeta registrada.`,
                );
            } else {
                // La prueba gratuita ya se usó (en tu cuenta o en este grupo): la suscripción arranca sin período de prueba.
                showSuccessToast(
                    "Plan premium activado",
                    `Tu suscripción mensual quedó registrada con la tarjeta terminada en ${subscription.cardLast4}. La prueba gratuita ya se usó (en tu cuenta o en este grupo), por eso no hay período de prueba.`,
                );
            }
            navigate(groupConfigPath(selectedGroup.joinCode));
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
                        <SelectField
                            id="premium-group"
                            label="Grupo"
                            placeholder="Elegí un grupo"
                            options={eligibleGroups.map((group) => ({value: group.joinCode, label: group.name}))}
                            value={selectedGroup?.joinCode ?? ""}
                            onChange={setChosenCode}
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
                        <Button type="submit" variant="default" size="modal" disabled={subscribe.isPending || checking}>
                            {subscribe.isPending ? "Procesando..." : copy.submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </CommonLayout>
    );
}
