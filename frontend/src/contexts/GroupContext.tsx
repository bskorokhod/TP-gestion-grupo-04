import {createContext, useContext} from "react";

import type {Group} from "@/models/Group.ts";

const GroupContext = createContext<Group | null>(null);

/** Lo provee `GroupGuard` una vez confirmado el acceso; no se usa fuera de /grupos/:code/*. */
export const GroupProvider = GroupContext.Provider;

/** El grupo actual (con id numérico, código, y rol/estado del usuario en él). */
export function useCurrentGroup(): Group {
    const group = useContext(GroupContext);
    if (group === null) {
        throw new Error("useCurrentGroup must be used inside a GroupGuard");
    }
    return group;
}
