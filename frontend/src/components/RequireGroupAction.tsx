import type {ReactNode} from "react";
import {Redirect} from "wouter";

import {groupConfigPath} from "@/constants/routes.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {can, type GroupAction} from "@/lib/permissions.ts";

interface RequireGroupActionProps {
    readonly action: GroupAction;
    readonly children: ReactNode;
}

/**
 * Deja pasar solo a quien puede ejecutar `action` en el grupo actual; al resto lo lleva a la
 * configuración (solo lectura). Va dentro de un GroupGuard. Es UX: el backend igual responde 403.
 */
export function RequireGroupAction({action, children}: RequireGroupActionProps) {
    const group = useCurrentGroup();

    if (!can(group, action)) {
        return <Redirect href={groupConfigPath(group.joinCode)} replace/>;
    }

    return <>{children}</>;
}
