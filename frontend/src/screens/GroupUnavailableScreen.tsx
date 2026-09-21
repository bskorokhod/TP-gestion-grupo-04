import {Link} from "wouter";

import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GROUPS_PATH} from "@/constants/routes.ts";

// TODO: PLACEHOLDER. Reemplazar por la pantalla de error definitiva de "grupo no disponible".
export const GroupUnavailableScreen = () => {
    return (
        <CommonLayout className="min-h-screen bg-background font-poppins text-foreground flex flex-col">
            <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <h1 className="text-3xl font-black md:text-4xl">Grupo no disponible</h1>
                <Link href={GROUPS_PATH} className="text-brand underline">
                    Volver a mis grupos
                </Link>
            </section>
        </CommonLayout>
    );
};
