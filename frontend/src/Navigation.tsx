import {Redirect, Route, Switch, useParams} from "wouter";

import {MainScreen} from "@/screens/MainScreen";
import {useToken} from "@/contexts/TokenContext.tsx";
import {LoginScreen} from "@/screens/Auth/LoginScreen.tsx";
import {SignupScreen} from "@/screens/Auth/SignupScreen.tsx";
import {GroupSelectionScreen} from "@/screens/GroupSelectionScreen.tsx";
import {ExpensesGroupScreen} from "@/screens/Group/ExpensesGroupScreen.tsx";
import {GroupUnavailableScreen} from "@/screens/GroupUnavailableScreen.tsx";
import {UnderConstructionGroupScreen} from "@/screens/UnderConstructionGroupScreen";
import {ConfigurationScreen} from "@/screens/Admin/ConfigurationScreen.tsx";
import {PercentageConfigScreen} from "@/screens/Admin/PercentageConfigScreen.tsx";
import {GroupGuard} from "@/components/GroupGuard.tsx";
import {RequireGroupAction} from "@/components/RequireGroupAction.tsx";
import {
    GROUP_UNAVAILABLE_PATH,
    GROUPS_PATH,
    groupExpensesPath,
    HOME_PATH,
    LOGIN_PATH,
    SIGNUP_PATH,
} from "@/constants/routes.ts";

/** Sin sesión: solo home, login y signup. Cualquier otra ruta lleva a login. */
const PublicRoutes = () => (
    <Switch>
        <Route path={HOME_PATH}>
            <MainScreen/>
        </Route>
        <Route path={LOGIN_PATH}>
            <LoginScreen/>
        </Route>
        <Route path={SIGNUP_PATH}>
            <SignupScreen/>
        </Route>

        <Route>
            <Redirect href={LOGIN_PATH} replace/>
        </Route>
    </Switch>
);

/**
 * Todo lo que cuelga de /grupos/:code (código del grupo, ABC-1234-XYZ) pasa por un único
 * GroupGuard, así una subruta nueva queda protegida por defecto. Las rutas internas son
 * absolutas (sin `nest`) para no romper a los componentes que leen la ubicación completa.
 */
const GroupArea = () => {
    const {code} = useParams<{ code: string }>();

    return (
        <GroupGuard>
            <Switch>
                <Route path="/grupos/:code/gastos">
                    <ExpensesGroupScreen/>
                </Route>
                <Route path="/grupos/:code/reservas">
                    <UnderConstructionGroupScreen/>
                </Route>
                <Route path="/grupos/:code/balance">
                    <UnderConstructionGroupScreen/>
                </Route>

                {/* Miembros comunes la ven en solo lectura; la pantalla decide qué acciones mostrar. */}
                <Route path="/grupos/:code/configuracion">
                    <ConfigurationScreen/>
                </Route>
                <Route path="/grupos/:code/configuracion/porcentajes">
                    <RequireGroupAction action="editPercentages">
                        <PercentageConfigScreen/>
                    </RequireGroupAction>
                </Route>

                {/* /grupos/:code y subrutas desconocidas: el usuario ya es miembro, va a la vista de gastos */}
                <Route>
                    <Redirect href={groupExpensesPath(code)} replace/>
                </Route>
            </Switch>
        </GroupGuard>
    );
};

/** Con sesión (o refrescándola): login y signup no tienen sentido, se lleva a /grupos. */
const PrivateRoutes = () => (
    <Switch>
        <Route path={HOME_PATH}>
            <MainScreen/>
        </Route>
        <Route path={LOGIN_PATH}>
            <Redirect href={GROUPS_PATH} replace/>
        </Route>
        <Route path={SIGNUP_PATH}>
            <Redirect href={GROUPS_PATH} replace/>
        </Route>
        <Route path={GROUPS_PATH}>
            <GroupSelectionScreen/>
        </Route>

        {/* TODO: reemplazar el placeholder por la pantalla definitiva */}
        <Route path={GROUP_UNAVAILABLE_PATH}>
            <GroupUnavailableScreen/>
        </Route>

        <Route path="/grupos/:code">
            <GroupArea/>
        </Route>
        <Route path="/grupos/:code/*">
            <GroupArea/>
        </Route>

        <Route>
            <Redirect href={HOME_PATH} replace/>
        </Route>
    </Switch>
);

export const Navigation = () => {
    const [tokenState] = useToken();
    switch (tokenState.state) {
        case "LOGGED_IN":
        case "REFRESHING":
            return <PrivateRoutes/>;
        case "LOGGED_OUT":
            return <PublicRoutes/>;
        default:
            // Make the compiler check this is unreachable
            return tokenState satisfies never;
    }
};
