export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const GROUPS_PATH = "/grupos";
export const GROUP_ROUTE_PATTERN = "/grupos/:code/*";
export const PREMIUM_PATH = "/premium";

/** Activar premium para un grupo no premium del usuario, elegido en la pantalla (no lleva código de grupo en la ruta). */
export const ACTIVATE_PREMIUM_PATH = "/grupos/activar-premium";

/** Destino de toda redirección por grupo inexistente o al que el usuario no tiene acceso. */
export const GROUP_UNAVAILABLE_PATH = "/grupo-no-disponible";

/** En las URLs el grupo se identifica por su código (ABC-1234-XYZ), no por su id numérico. */
export const groupReservationsPath = (groupCode: string) => `/grupos/${groupCode}/reservas`;
export const groupExpensesPath = (groupCode: string) => `/grupos/${groupCode}/gastos`;
export const groupConfigPath = (groupCode: string) => `/grupos/${groupCode}/configuracion`;
export const groupVotesPath = (groupCode: string) => `/grupos/${groupCode}/votaciones`;
export const groupPercentagesPath = (groupCode: string) => `/grupos/${groupCode}/configuracion/porcentajes`;
/** Lleva a activar premium con el grupo preseleccionado (el usuario puede cambiarlo en la pantalla). */
export const groupPremiumApplicationPath = (groupCode: string) =>
    `${ACTIVATE_PREMIUM_PATH}?grupo=${encodeURIComponent(groupCode)}`;

/** Pago de un grupo premium que todavía no existe: se crea junto con la suscripción. */
export const CREATE_PREMIUM_GROUP_PATH = "/crear-grupo-premium";
