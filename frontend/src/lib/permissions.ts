import type {Group} from "@/models/Group.ts";

/**
 * Acciones de gestión de un grupo. Espejan las reglas del backend (GroupService):
 * todas exigen membresía ACTIVE (`requireActiveMember`), porque un miembro DEACTIVATED
 * puede ver el grupo pero cualquier escritura le devuelve 409.
 *
 * Esto es solo para decidir qué mostrar; la autorización real la aplica el backend.
 */
export type GroupAction =
    | "reviewJoinRequests"
    | "removeMembers"
    | "editPercentages"
    | "finalizeExits"
    | "changeRoles"
    | "removeAdmins";

type GroupRole = Group["myRole"];

const ROLE_RANK: Record<GroupRole, number> = {
    FOUNDER: 0,
    ADMIN: 1,
    MEMBER: 2,
};

const REQUIRED_ROLE: Record<GroupAction, GroupRole> = {
    reviewJoinRequests: "ADMIN",
    removeMembers: "ADMIN",
    editPercentages: "ADMIN",
    finalizeExits: "ADMIN",
    changeRoles: "FOUNDER",
    removeAdmins: "FOUNDER",
};

export function can(membership: Pick<Group, "myRole" | "myStatus">, action: GroupAction): boolean {
    return (
        membership.myStatus === "ACTIVE" &&
        ROLE_RANK[membership.myRole] <= ROLE_RANK[REQUIRED_ROLE[action]]
    );
}
