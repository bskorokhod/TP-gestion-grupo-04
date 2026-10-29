import {type FormEvent, useState} from "react";
import {useLocation} from "wouter";
import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import TextField from "@/components/Forms/TextField.tsx";
import {TextInput} from "@/components/Forms/TextInput.tsx";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import {groupConfigPath, GROUPS_PATH} from "@/constants/routes.ts";

const TRIAL_DAYS = 7;

export function PremiumApplicationScreen() {
    const group = useCurrentGroup();
    const [, navigate] = useLocation();
    const {showSuccessToast} = useFormToasts();
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiration, setExpiration] = useState("");
    const [securityCode, setSecurityCode] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        showSuccessToast(
            "Prueba premium iniciada",
            `No se realizará ningún débito durante los primeros ${TRIAL_DAYS} días. Luego se cobrará automáticamente en la tarjeta registrada.`,
        );
        navigate(groupConfigPath(group.joinCode));
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
                            Comenzar prueba premium
                        </h1>
                    </div>
                    <p className="mt-3 text-base text-warm-muted">
                        Probá las funciones premium gratis durante {TRIAL_DAYS} días. Después se debitará automáticamente
                        el plan en la tarjeta que registres.
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
                        <Button type="submit" variant="default" size="modal">
                            Comenzar prueba gratuita
                        </Button>
                    </div>
                </form>
            </div>
        </CommonLayout>
    );
}
