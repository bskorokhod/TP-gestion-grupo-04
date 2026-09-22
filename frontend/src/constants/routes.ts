export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const GROUPS_PATH = "/grupos";

/** Destino de toda redirección por grupo inexistente o al que el usuario no tiene acceso. */
export const GROUP_UNAVAILABLE_PATH = "/grupo-no-disponible";

/** En las URLs el grupo se identifica por su código (ABC-1234-XYZ), no por su id numérico. */
export const groupExpensesPath = (groupCode: string) => `/grupos/${groupCode}/gastos`;
export const groupConfigPath = (groupCode: string) => `/grupos/${groupCode}/configuracion`;
