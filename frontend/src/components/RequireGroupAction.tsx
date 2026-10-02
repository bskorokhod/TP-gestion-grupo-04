import type {ReactNode} from "react";
import {Redirect} from "wouter";

import {groupConfigPath} from "@/constants/routes.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";

interface RequireGroupActionProps {
    readonly children: ReactNode;
}

/**
 * Deja pasar solo a quien puede ejecutar `action` en el grupo actual; al resto lo lleva a la
 * configuración (solo lectura). Va dentro de un GroupGuard. Es UX: el backend igual responde 403.
 */
export function RequireGroupAction({children}: RequireGroupActionProps) {
    const group = useCurrentGroup();


    if (group.myStatus !== "ACTIVE") {
        return <Redirect href={groupConfigPath(group.joinCode)} replace/>;
    }

    return <>{children}</>;
}
