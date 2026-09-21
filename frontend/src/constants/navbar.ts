export interface NavLink {
    readonly label: string;
    readonly to: string;
}

export const LOGIN_LINK: NavLink = {label: "Iniciar sesión", to: "/login"};
export const SIGNUP_LINK: NavLink = {label: "Crear cuenta", to: "/signup"};

export const GROUPS_LINK: NavLink = {label: "Mis grupos", to: "/grupos"};
export const EDIT_PROFILE_LINK: NavLink = {label: "Modificar perfil", to: "/perfil"};
