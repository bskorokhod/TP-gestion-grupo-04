import {Redirect, Route, Switch, useParams} from "wouter";

import {MainScreen} from "@/screens/MainScreen";
import {useToken} from "@/contexts/TokenContext.tsx";
import {LoginScreen} from "@/screens/Auth/LoginScreen.tsx";
import {SignupScreen} from "@/screens/Auth/SignupScreen.tsx";
import {GroupSelectionScreen} from "@/screens/GroupSelectionScreen.tsx";
import {ExpensesGroupScreen} from "@/screens/Group/ExpensesGroupScreen.tsx";
import {ReservationsGroupScreen} from "@/screens/Group/ReservationsGroupScreen.tsx";
import {VotesGroupScreen} from "@/screens/Group/VotesGroupScreen.tsx";
import {GroupUnavailableScreen} from "@/screens/GroupUnavailableScreen.tsx";
import {BalanceGroupScreen} from "@/screens/Group/BalanceGroupScreen";
import {ConfigurationScreen} from "@/screens/Admin/ConfigurationScreen.tsx";
import {PercentageConfigScreen} from "@/screens/Admin/PercentageConfigScreen.tsx";
import {ProfileScreen} from "@/screens/Profile/ProfileScreen.tsx";
import {PremiumApplicationScreen} from "@/screens/Group/PremiumApplicationScreen.tsx";
import {PremiumPlansScreen} from "@/screens/Group/PremiumPlansScreen.tsx";
import {PremiumGroupCreationScreen} from "@/screens/Group/PremiumGroupCreationScreen.tsx";
import {GroupGuard} from "@/components/GroupGuard.tsx";
import {RequireGroupAction} from "@/components/RequireGroupAction.tsx";
import {
    CREATE_PREMIUM_GROUP_PATH,
    GROUP_UNAVAILABLE_PATH,
    GROUPS_PATH,
    HOME_PATH,
    LOGIN_PATH,
    SIGNUP_PATH,
    groupReservationsPath,
    PREMIUM_PATH
} from "@/constants/routes.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {useGetPremiumNotices, useMarkPremiumNoticesSeen} from "@/services/GroupServices.ts";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import {useEffect} from "react";

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
        <Route path={PREMIUM_PATH}>
            <PremiumPlansScreen/>
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
            <PremiumNotices/>
            <Switch>
                <Route path="/grupos/:code/reservas">
                    <ReservationsGroupScreen/>
                </Route>
                <Route path="/grupos/:code/gastos">
                    <ExpensesGroupScreen/>
                </Route>
                <Route path="/grupos/:code/balance">
                    <BalanceGroupScreen/>
                </Route>
                <Route path="/grupos/:code/votaciones">
                    <VotesGroupScreen/>
                </Route>

                <Route path="/grupos/:code/configuracion">
                    <ConfigurationScreen/>
                </Route>
                <Route path="/grupos/:code/configuracion/porcentajes">
                    <RequireGroupAction requirePercentageDistribution>
                        <PercentageConfigScreen/>
                    </RequireGroupAction>
                </Route>
                <Route path="/grupos/:code/premium">
                    <PremiumApplicationScreen/>
                </Route>

                {/* /grupos/:code y subrutas desconocidas: el usuario ya es miembro, va a la vista de gastos */}
                <Route>
                    <Redirect href={groupReservationsPath(code)} replace/>
                </Route>
            </Switch>
        </GroupGuard>
    );
};

function PremiumNotices() {
    const group = useCurrentGroup();
    const notices = useGetPremiumNotices(group.id);
    const markSeen = useMarkPremiumNoticesSeen(group.id);
    const {showSuccessToast, showErrorToast} = useFormToasts();

    useEffect(() => {
        if (!notices.data?.length) return;
        notices.data.forEach((notice) => {
            const title = notice.type === "PAYMENT_FAILED" ? "No se pudo cobrar Premium" : "Actualización de Premium";
            const description = notice.until
                ? `El grupo conserva Premium hasta el ${new Date(notice.until).toLocaleDateString("es-AR")}.`
                : notice.type === "TRIAL_ENDING" ? "A tu prueba gratuita le quedan pocos días." : "Hay una novedad sobre el plan premium del grupo.";
            if (notice.type === "PAYMENT_FAILED") showErrorToast(title, description);
            else showSuccessToast(title, description);
        });
        void markSeen.mutateAsync();
        // Los callbacks de toast y la mutación se recrean en cada render; los avisos deben procesarse una sola vez por respuesta.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notices.data]);
    return null;
}

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
        <Route path={CREATE_PREMIUM_GROUP_PATH}>
            <PremiumGroupCreationScreen/>
        </Route>

        <Route path="/perfil">
            <ProfileScreen/>
        </Route>

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
