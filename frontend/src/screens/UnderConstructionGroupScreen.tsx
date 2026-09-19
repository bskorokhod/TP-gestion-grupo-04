import Button from "@/components/Button.tsx"

import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";
import {Link} from "wouter";

export const UnderConstructionGroupScreen = () => {
    return (
        <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
            <GroupNavbar children={undefined}/>
            <section
                className="grid flex-1 items-center justify-center bg-background px-6 text-center text-foreground">
                <div className="max-w-md space-y-5">
                    <span className="inline-flex rounded-full bg-muted px-4 py-2 text-xs font-medium text-primary">
                         Próximamente
                    </span>
                    <h1 className="text-3xl font-black md:text-4xl">Aún no disponible</h1>
                    <p className="text-sm leading-relaxed text-ink-soft md:text-base">
                        Esta sección todavía no está disponible. Estamos trabajando para que pronto puedas
                        disfrutarla. Volvé en un tiempo, ¡pronto llegará!
                    </p>
                    <div className="pt-2">
                        <Link key="inicio" href="/">
                            <Button variant="hero">Volver al inicio</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </CommonLayout>
    );
}