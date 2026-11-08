import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faCrown} from "@fortawesome/free-solid-svg-icons";
import {Link, useLocation} from "wouter";

import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {groupPremiumApplicationPath, groupReservationsPath} from "@/constants/routes.ts";
import {useCancelGroupPremium, useGetPremiumStatus} from "@/services/GroupServices.ts";

const benefits = [
    {title: "Potenciá tu grupo", copy: "Personalizá las configuraciones y gestioná tu grupo con más libertad."},
    {title: "Controlá el balance", copy: "Llevá un control claro de los gastos y del balance de todos."},
    {title: "Economía e historial", copy: "Consultá el historial y tomá decisiones con toda la información."},
];

const premiumFeatures = [
    "Configuraciones premium",
    "Más control sobre tu grupo",
    "Historial de gastos completo",
    "Votaciones y reservas avanzadas",
];

export function PremiumPlansScreen() {
    const group = useCurrentGroup();
    const [, navigate] = useLocation();
    const {showSuccessToast, showApiError} = useFormToasts();
    const status = useGetPremiumStatus(group.id);
    const cancel = useCancelGroupPremium(group.id);
    const premium = status.data?.premium ?? group.isPremium;
    const price = status.data?.monthlyPrice?.toLocaleString("es-AR") ?? "4.499";
    const trialDays = status.data?.trialDays ?? 7;

    async function handleCancel() {
        try {
            const result = await cancel.mutateAsync();
            showSuccessToast(
                result.trial ? "Prueba cancelada" : "Premium cancelado",
                result.endsAt
                    ? `El grupo conserva Premium hasta el ${new Date(result.endsAt).toLocaleDateString("es-AR")}.`
                    : "El grupo volvió al plan gratuito.",
            );
            void status.refetch();
        } catch (error) {
            showApiError(error as BackendError, "No se pudo cancelar Premium");
        }
    }

    const primaryAction = premium ? handleCancel : () => navigate(groupPremiumApplicationPath(group.joinCode));
    const primaryLabel = premium ? "Cancelar premium" : "Probá premium por 7 días";

    return (
        <main className="min-h-screen bg-[#f7f6ed] text-[#24332e]">
            <header className="flex h-14 items-center justify-between border-b border-[#d9ded3] bg-[#f7f6ed] px-5 sm:px-12">
                <Link href={groupReservationsPath(group.joinCode)} className="font-display text-sm font-black tracking-tight">
                    esnuestro<span className="ml-1 text-[#4c7a6e]">•</span>
                </Link>
                <nav className="flex items-center gap-5 text-[10px] font-semibold sm:gap-9 sm:text-xs">
                    <a href="#planes" className="hover:text-[#b87317]">Comprar plan</a>
                    <Link href={groupReservationsPath(group.joinCode)} className="hover:text-[#b87317]">Iniciar sesión</Link>
                    <Link href={groupReservationsPath(group.joinCode)} className="rounded-full bg-[#416f64] px-4 py-2 text-white hover:bg-[#345d53]">Crear cuenta</Link>
                </nav>
            </header>

            <section className="bg-gradient-to-br from-[#eef1e8] via-[#f2f1e8] to-[#dce4d9] px-6 py-14 sm:px-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <h1 className="max-w-xl text-4xl font-black leading-[.98] tracking-tight sm:text-6xl">
                        El mejor lugar<br/>para<br/><em className="font-serif font-bold">compartir</em>
                    </h1>
                    <p className="mt-5 max-w-sm text-xs leading-relaxed text-[#627069] sm:text-sm">
                        Todo lo que necesitás para organizar tu grupo y disfrutar más de tu bien compartido.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button type="button" onClick={primaryAction} disabled={cancel.isPending} className="rounded-full bg-[#c77b18] px-5 py-2 text-xs font-bold text-white hover:bg-[#a9610d]">
                            {cancel.isPending ? "Cancelando..." : primaryLabel}
                        </button>
                        <a href="#planes" className="rounded-full border border-[#9ba79d] px-5 py-2 text-xs font-medium text-[#68766f]">Comparar planes</a>
                    </div>
                </div>
            </section>

            <section className="bg-[#f7f5eb] px-6 py-14 text-center sm:px-16 sm:py-20">
                <p className="text-xs font-bold text-[#3d665b]">esnuestro <span className="text-[#c77b18]">Premium</span></p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Gestioná sin límites</h2>
                <div className="mx-auto mt-10 grid max-w-5xl gap-8 text-left sm:grid-cols-3">
                    {benefits.map((benefit, index) => (
                        <article key={benefit.title} className="flex gap-3">
                            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f2dcae] text-[#b87317]">
                                <FontAwesomeIcon icon={index === 0 ? faCrown : faCheck} className="text-xs"/>
                            </span>
                            <div>
                                <h3 className="text-sm font-extrabold">{benefit.title}</h3>
                                <p className="mt-1 text-xs leading-relaxed text-[#77827a]">{benefit.copy}</p>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={primaryAction} disabled={cancel.isPending} className="rounded-full bg-[#c77b18] px-5 py-2 text-xs font-bold text-white">
                        {cancel.isPending ? "Cancelando..." : primaryLabel}
                    </button>
                    <a href="#planes" className="rounded-full border border-[#9ba79d] px-5 py-2 text-xs font-medium text-[#68766f]">Comparar planes</a>
                </div>
                <p className="mt-3 text-[10px] text-[#89938c]">Sin compromiso. Cancelá cuando quieras.</p>
            </section>

            <section id="planes" className="bg-[#e6ebdf] px-6 py-14 sm:px-16 sm:py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Los que saben, gestionan acá</h2>
                    <p className="mt-2 text-xs text-[#66746c]">Sumate ahora con <span className="font-bold text-[#c77b18]">Premium</span></p>
                    <div className="mt-10 grid gap-6 text-left sm:grid-cols-2">
                        <article className="flex min-h-64 flex-col rounded-xl bg-[#faf9f2] p-7 shadow-[0_8px_20px_rgba(54,65,57,.1)]">
                            <h3 className="text-sm font-bold">esnuestro <span className="text-[#3d665b]">Estándar</span></h3>
                            <p className="mt-1 text-[10px] text-[#89938c]">El plan simple para empezar.</p>
                            <ul className="mt-5 space-y-2 text-[10px] text-[#68766f]">
                                <li>• Grupos y miembros</li><li>• Gastos compartidos</li><li>• Reservas básicas</li>
                            </ul>
                            <button type="button" onClick={() => navigate(groupReservationsPath(group.joinCode))} className="mt-auto rounded-full bg-[#3d7065] py-2 text-[10px] font-bold text-white">Empezá ahora gratis</button>
                        </article>
                        <article className="relative flex min-h-64 flex-col rounded-xl bg-[#faf9f2] p-7 shadow-[0_8px_20px_rgba(54,65,57,.1)]">
                            <span className="absolute right-5 top-5 rounded-full bg-[#f2dcae] px-2 py-1 text-[9px] font-bold text-[#b87317]"><FontAwesomeIcon icon={faCrown}/> Premium</span>
                            <h3 className="text-sm font-bold">esnuestro <span className="text-[#c77b18]">Premium</span></h3>
                            <p className="mt-1 text-[10px] text-[#89938c]">${price} / mes · {trialDays} días gratis</p>
                            <ul className="mt-5 space-y-2 text-[10px] text-[#68766f]">
                                {premiumFeatures.map((feature) => <li key={feature}>• {feature}</li>)}
                            </ul>
                            <button type="button" onClick={primaryAction} disabled={cancel.isPending} className="mt-auto rounded-full bg-[#c77b18] py-2 text-[10px] font-bold text-white">
                                {cancel.isPending ? "Cancelando..." : primaryLabel}
                            </button>
                        </article>
                    </div>
                </div>
            </section>

            <footer className="flex items-center justify-between bg-[#213b35] px-6 py-5 text-[9px] text-white sm:px-12">
                <strong>esnuestro</strong>
                <span>© 2026 EsNuestro · Todos los derechos reservados</span>
            </footer>
        </main>
    );
}
