import {CommonLayout} from "@/components/CommonLayout/CommonLayout";
import homeIllustration from "@/assets/home.svg";
import Button from "@/components/Button.jsx";
import {FeatureCard, SectionHeading, StatsBar, StepCard, TestimonialCard, type Stat} from "@/components/Cards.jsx";
import {Link} from "wouter";

const features = [
    {
        icon: "📅",
        title: "Calendario compartido",
        copy: "Cada miembro ve y reserva sus días sin pisarse. Colores por persona, sin ambigüedades.",
        tone: "bg-olive/50"
    },
    {
        icon: "💰",
        title: "Gestión de gastos",
        copy: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore.",
        tone: "bg-amber/50"
    },
    {
        icon: "📋",
        title: "Historial y decisiones",
        copy: "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim.",
        tone: "bg-lilac/50"
    },
];

const steps = [
    ["Creá tu grupo", "Dale un nombre que lo represente."],
    ["Agregá tu bien", "Consectetur adipiscing elit sed do eiusmod tempor. Ut enim ad minim veniam quis nostrud exercitation ullamco."],
    ["Invitá a tu grupo", "Compartiles el código de invitación para que se unan."],
];

const testimonials = [
    {
        initial: "M",
        name: "María G.",
        role: "Propietaria, casa de playa",
        quote: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        tone: "bg-olive/30",
        avatar: "bg-olive/55 text-foreground"
    },
    {
        initial: "R",
        name: "Roberto P.",
        role: "Miembro, cabaña familiar",
        quote: "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. Ut enim ad minim veniam quis nostrud exercitation.",
        tone: "bg-lilac/30",
        avatar: "bg-lilac/55 text-foreground"
    },
    {
        initial: "C",
        name: "Carla M.",
        role: "Administradora del grupo",
        quote: "Sed do eiusmod tempor incididunt ut labore et dolore. Ut enim ad minim veniam quis nostrud ullamco laboris nisi aliquip.",
        tone: "bg-amber/30",
        avatar: "bg-amber/55 text-foreground"
    },
];

const stats: Stat[] = [
    ["2.400+ grupos", "activos"],
    ["18.000+ reservas", "coordinadas"],
    ["$12M+ gastos", "gestionados"],
    ["4.9 ★", "promedio"],
];

export const MainScreen = () => {
    return (
        <CommonLayout className="min-h-screen overflow-hidden text-foreground login-backdrop">
            <section className="h-[calc(100vh-60px)] ">
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

            <StatsBar stats={stats}/>

            <section className="px-6 pb-20 pt-8">
                <div className="mx-auto max-w-6xl space-y-9">
                    <SectionHeading
                        title="Todo lo que necesita tu grupo"
                        copy="Tres pilares para gestionar cualquier bien compartido entre personas."
                    />
                    <div className="grid gap-5 md:grid-cols-3">
                        {features.map((item) => (
                            <FeatureCard key={item.title} {...item} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-section px-6 py-16">
                <div className="mx-auto max-w-6xl space-y-9">
                    <SectionHeading
                        title="Empezá en 3 simples pasos"
                        copy="¡Sumarte con tu grupo es así de fácil!"
                    />
                    <div className="grid gap-5 md:grid-cols-3">
                        {steps.map(([title, copy], index) => (
                            <StepCard key={title} index={index + 1} title={title} copy={copy}/>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 py-20">
                <div className="mx-auto max-w-6xl space-y-9">
                    <SectionHeading
                        title="Lo que dicen nuestros usuarios"
                        copy="Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt."
                    />
                    <div className="grid gap-5 md:grid-cols-3">
                        {testimonials.map((item) => (
                            <TestimonialCard key={item.name} {...item} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-primary px-6 py-12 text-center text-primary-foreground">
                <h2 className="text-2xl font-black md:text-3xl">¿Listo para organizar tu grupo?</h2>
                <p className="mx-auto mt-4 text-base text-secondary">
                    Lorem ipsum dolor sit amet consectetur. Empezá gratis hoy, sin tarjeta de crédito.
                </p>
                <Button className="mt-6" variant="pill">
                    <Link key="crear-cuenta" href="/signup">
                        Crear cuenta gratis
                    </Link>
                </Button>
            </section>

        </CommonLayout>
    );
};
