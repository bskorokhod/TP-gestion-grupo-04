import type {ReactNode} from "react";
import {Redirect, useParams} from "wouter";

import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GROUP_UNAVAILABLE_PATH, LOGIN_PATH} from "@/constants/routes.ts";
import {GroupProvider} from "@/contexts/GroupContext.tsx";
import {useToken} from "@/contexts/TokenContext.tsx";
import {getApiErrorStatus} from "@/lib/api.ts";
import {JOIN_CODE_REGEX} from "@/models/Group.ts";
import {useGetGroupByCode} from "@/services/GroupServices.ts";

// El backend responde 404 si el grupo no existe o el caller no es miembro, y 403 si tuvo una
// relación con el grupo pero ya no puede verlo (solicitud pendiente/rechazada, salió, lo removieron).
// Para el usuario todos son "grupo no disponible".
const UNAVAILABLE_STATUSES: ReadonlyArray<number> = [403, 404];

interface GroupGuardProps {
    readonly children: ReactNode;
}

/**
 * Protege todo lo que cuelga de `/grupos/:code`, donde `code` es el código del grupo (ABC-1234-XYZ).
 * Solo renderiza `children` si el backend confirma que el usuario puede ver el grupo (miembros ACTIVE
 * o DEACTIVATED), y entrega el grupo resuelto a las pantallas vía `useCurrentGroup()`.
 *
 * Es una barrera de UX: la autorización real vive en el backend.
 */
export function GroupGuard({children}: GroupGuardProps) {
    const [tokenState] = useToken();
    const {code} = useParams<{ code: string }>();

    if (tokenState.state === "LOGGED_OUT") {
        return <Redirect href={LOGIN_PATH} replace/>;
    }

    if (!code || !JOIN_CODE_REGEX.test(code)) {
        return <Redirect href={GROUP_UNAVAILABLE_PATH} replace/>;
    }

    return <GroupAccessCheck groupCode={code}>{children}</GroupAccessCheck>;
}

interface GroupAccessCheckProps {
    readonly groupCode: string;
    readonly children: ReactNode;
}

function GroupAccessCheck({groupCode, children}: GroupAccessCheckProps) {
    const {data: group, isError, error, refetch} = useGetGroupByCode(groupCode);

    // Aunque ya tengamos el grupo en caché, un 403/404 del refetch (p. ej. lo removieron) lo saca de acá.
    if (isError) {
        const status = getApiErrorStatus(error);
        if (status !== null && UNAVAILABLE_STATUSES.includes(status)) {
            return <Redirect href={GROUP_UNAVAILABLE_PATH} replace/>;
        }
    }

    // Un fallo transitorio (red, 5xx) al refrescar no debe desmontar una pantalla que ya estaba abierta.
    if (group) {
        return <GroupProvider value={group}>{children}</GroupProvider>;
    }

    if (isError) {
        // Error de red o 5xx sin datos previos: no es un problema de acceso, no lo disfrazamos de "no disponible".
        return (
            <CommonLayout className="min-h-screen bg-background text-foreground flex flex-col">
                <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                    <p className="text-base font-medium text-group-danger">
                        No pudimos verificar tu acceso al grupo. Probá de nuevo en un momento.
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="rounded-full bg-brand px-6 py-3 text-brand-foreground"
                    >
                        Reintentar
                    </button>
                </div>
            </CommonLayout>
        );
    }

    return (
        <CommonLayout className="min-h-screen bg-background text-foreground flex flex-col">
            <p role="status" className="flex flex-1 items-center justify-center text-warm-muted">
                Cargando grupo...
            </p>
        </CommonLayout>
    );
}
