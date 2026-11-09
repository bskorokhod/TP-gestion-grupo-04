import {CommonLayout} from "@/components/CommonLayout/CommonLayout";
import homeIllustration from "@/assets/home.svg";
import Button from "@/components/Button.jsx";
import {Link} from "wouter";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowRight, faCalendarCheck, faChartSimple, faClock, faCrown, faGear, faHouseChimney,
    faQuoteLeft, faScaleBalanced, faUserPlus, faUsers, faWallet, type IconDefinition,}
    from "@fortawesome/free-solid-svg-icons";
import {PREMIUM_PATH} from "@/constants/routes.ts";


const stats: ReadonlyArray<{ icon: IconDefinition; value: string; label: string }> = [
    {icon: faUsers, value: "+60", label: "grupos organizados"},
    {icon: faCalendarCheck, value: "+400", label: "reservas coordinadas"},
    {icon: faHouseChimney, value: "+60", label: "bienes compartidos"},
];

const features: ReadonlyArray<{ icon: IconDefinition; title: string; copy: string; tone: string }> = [
    {
        icon: faCalendarCheck,
        title: "Reservas sin superposiciones",
        copy: "Un calendario común para saber quién usa qué y cuándo. Se terminaron los “yo pensé que estaba libre”.",
        tone: "bg-brand/15 text-brand",
    },
    {
        icon: faWallet,
        title: "Gastos claros",
        copy: "Cargá cada gasto, dividilo entre el grupo y mirá al instante quién debe y a quién.",
        tone: "bg-amber/15 text-amber",
    },
    {
        icon: faScaleBalanced,
        title: "Decisiones en conjunto",
        copy: "Proponé mejoras o compras y votá con tu grupo. Todo queda registrado para todos.",
        tone: "bg-olive/15 text-olive",
    },
];

const steps: ReadonlyArray<{ icon: IconDefinition; title: string; copy: string }> = [
    {icon: faHouseChimney, title: "Creá tu grupo", copy: "Ponele nombre y contanos qué bien comparten: una casa, un auto, un quincho."},
    {icon: faUserPlus, title: "Invitá a los tuyos", copy: "Compartí el código del grupo y sumá a tu familia, amigos o socios."},
    {icon: faCalendarCheck, title: "Organizá todo", copy: "Reservá fechas, cargá gastos y tomá decisiones desde un solo lugar."},
];

const testimonials: ReadonlyArray<{ name: string; role: string; quote: string; avatar: string }> = [
    {
        name: "Lucía M.",
        role: "Casa de fin de semana · 5 hermanos",
        quote: "Antes los fines de semana largos eran una discusión. Ahora cada uno reserva y listo.",
        avatar: "bg-custom-lilac",
    },
    {
        name: "Martín R.",
        role: "Auto compartido · 3 amigos",
        quote: "Por fin sabemos cuánto gastamos en nafta y service sin hacer cuentas en una planilla.",
        avatar: "bg-custom-orange",
    },
    {
        name: "Carla y Diego",
        role: "Departamento en la costa · 2 familias",
        quote: "Lo que más usamos son las votaciones. Decidimos el arreglo del techo en un día.",
        avatar: "bg-custom-green",
    },
];

const premiumPerks: ReadonlyArray<{ icon: IconDefinition; title: string }> = [
    {icon: faGear, title: "Configuraciones exclusivas"},
    {icon: faChartSimple, title: "Balance y gastos por categoría"},
    {icon: faClock, title: "Historial completo del grupo"},
];

export const MainScreen = () => {
    return (
        <CommonLayout className="min-h-screen overflow-hidden text-foreground bg-background">
            <section className="h-[calc(100vh-60px)] login-backdrop">
                <div className="h-full mx-auto px-6 py-16 md:px-12 pb-0 flex flex-row">
                    <div className="space-y-6 h-full content-center ps-16 basis-1/2">
                        <span className="inline-flex rounded-full bg-card/80 px-4 py-2 text-xs font-medium text-primary">
                            Gestión colaborativa · Bienes compartidos
                        </span>
                        <h1 className="text-4xl font-black leading-tight md:text-6xl">
                            Tu lugar compartido,
                            <br/>
                            sin el caos.
                        </h1>
                        <p className="max-w-lg text-base leading-relaxed text-ink-soft md:text-lg">
                            Coordiná reservas, gastos y decisiones con tu grupo
                            <br className="hidden md:block"/> — familia, amigos o socios. Sin caos, sin
                            confusiones.
                        </p>
                        <Button variant="hero" size="hero" className={undefined}>
                            <Link key="mis-grupos" href="/grupos">
                                Crear mi grupo gratis
                            </Link>
                        </Button>
                    </div>
                    <div className="justify-center h-full content-end basis-1/2">
                        <img
                            className="hidden w-full md:block content-end"
                            src={homeIllustration}
                            alt="EsNuestro, gestión colaborativa de bienes compartidos"
                        />
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="relative z-10 px-6">
                <div className="mx-auto -mt-10 grid max-w-5xl gap-4 rounded-4xl bg-panel p-6 shadow-panel md:grid-cols-3 md:p-8">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className={`flex items-center gap-4 px-4 ${index > 0 ? "md:border-l md:border-ink-soft/20" : ""}`}
                        >
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
                                <FontAwesomeIcon icon={stat.icon} aria-hidden/>
                            </span>
                            <div>
                                <p className="text-3xl font-black leading-none text-footer">{stat.value}</p>
                                <p className="mt-1 text-sm text-ink-soft">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="px-6 pb-20 pt-20 bg-background">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Qué podés hacer</p>
                            <h2 className="mt-3 text-4xl font-black leading-none text-footer md:text-6xl">
                                Todo lo que <br/>necesita tu <em className="font-extrabold">grupo</em>
                            </h2>
                        </div>
                        <p className="max-w-md text-base leading-relaxed text-ink-soft md:justify-self-end">
                            Tres pilares para gestionar cualquier bien compartido entre personas, sin planillas ni
                            grupos de chat interminables.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {features.map((item, index) => (
                            <article
                                key={item.title}
                                className={`group flex flex-col rounded-4xl bg-panel p-8 shadow-group transition-transform duration-300 hover:-translate-y-1 hover:shadow-panel ${index === 1 ? "md:mt-10" : ""}`}
                            >
                                <span className={`mb-6 grid size-12 place-items-center rounded-xl ${item.tone}`}>
                                    <FontAwesomeIcon icon={item.icon} className="h-5 w-5" aria-hidden/>
                                </span>
                                <h3 className="text-xl font-bold text-ink">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.copy}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section className="bg-section px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-14 text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-amber">Cómo funciona</p>
                        <h2 className="mt-3 text-4xl font-black text-footer md:text-5xl">
                            Empezá en <span className="text-amber">3</span> simples pasos
                        </h2>
                        <p className="mt-3 text-ink-soft">¡Sumarte con tu grupo es así de fácil!</p>
                    </div>
                    <ol className="relative grid gap-10 md:grid-cols-3">
                        <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-ink-soft/30 md:block" aria-hidden/>
                        {steps.map((step, index) => (
                            <li key={step.title} className="relative flex flex-col items-center text-center">
                                <span className="relative grid size-16 place-items-center rounded-full bg-panel text-brand shadow-group">
                                    <FontAwesomeIcon icon={step.icon} className="h-6 w-6" aria-hidden/>
                                    <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-footer text-xs font-bold text-brand-foreground">
                                        {index + 1}
                                    </span>
                                </span>
                                <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
                                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">{step.copy}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Premium */}
            <section className="px-6 py-20">
                <div className="login-backdrop mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-4xl p-10 shadow-panel md:grid-cols-2 md:items-center md:p-14">
                    <div>
                        <span className="mb-5 grid size-11 place-items-center rounded-lg bg-amber/15 text-amber">
                            <FontAwesomeIcon icon={faCrown} aria-hidden/>
                        </span>
                        <p className="text-3xl font-semibold text-ink">esnuestro <span className="text-amber">Premium</span></p>
                        <h2 className="mt-2 text-4xl font-black leading-none text-footer md:text-5xl">
                            Llevá tu grupo <br/>al <em className="font-extrabold">siguiente nivel</em>
                        </h2>
                        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
                            Más control sobre tus gastos y configuraciones pensadas para tu bien. Probalo gratis
                            durante 7 días.
                        </p>
                        
                        <Link to={PREMIUM_PATH}>
                            <Button type="button" variant="proposal" className="mt-8 h-14 px-8 text-base font-bold">
                                Ver más <FontAwesomeIcon icon={faArrowRight} className="ms-2" aria-hidden/>
                            </Button>
                        </Link>
                    </div>
                    <ul className="space-y-4">
                        {premiumPerks.map((perk) => (
                            <li key={perk.title} className="flex items-center gap-4 rounded-3xl bg-panel/80 p-5 shadow-group">
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
                                    <FontAwesomeIcon icon={perk.icon} aria-hidden/>
                                </span>
                                <p className="font-semibold text-ink">{perk.title}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-section px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Grupos reales</p>
                        <h2 className="mt-3 text-4xl font-black leading-none text-footer md:text-5xl">
                            Lo que dicen <em className="font-extrabold">nuestros usuarios</em>
                        </h2>
                        <p className="mt-4 text-ink-soft">
                            Familias y amigos que dejaron atrás las planillas y los malentendidos.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {testimonials.map((item) => (
                            <figure key={item.name} className="flex flex-col rounded-4xl bg-panel p-8 shadow-group">
                                <FontAwesomeIcon icon={faQuoteLeft} className="h-6 w-6 text-amber" aria-hidden/>
                                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-ink">
                                    “{item.quote}”
                                </blockquote>
                                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-soft/20 pt-5">
                                    <span className={`grid size-10 place-items-center rounded-full text-sm font-bold text-ink ${item.avatar}`}>
                                        {item.name.charAt(0)}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-ink">{item.name}</p>
                                        <p className="text-xs text-ink-soft">{item.role}</p>
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-footer px-6 py-16 text-center text-brand-foreground">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-4xl font-black leading-tight md:text-5xl">
                        ¿Listo para organizar <em className="font-extrabold text-amber-soft">tu grupo</em>?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-base text-secondary">
                        Creá tu grupo en minutos e invitá a los tuyos. Empezá gratis hoy, sin tarjeta de crédito.
                    </p>
                    <Button className="mt-8" variant="pill">
                        <Link key="crear-cuenta" href="/signup">
                            Crear cuenta gratis
                        </Link>
                    </Button>
                </div>
            </section>
        </CommonLayout>
    );
};

