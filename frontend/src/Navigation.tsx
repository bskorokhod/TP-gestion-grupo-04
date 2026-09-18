import {Redirect, Route, Switch} from "wouter";

import {MainScreen} from "@/screens/MainScreen";
import {useToken} from "@/services/TokenContext";
import {LoginScreen} from "@/screens/Auth/LoginScreen.tsx";
import {SignupScreen} from "@/screens/Auth/SignupScreen.tsx";
import {GroupSelectionScreen} from "@/screens/GroupSelectionScreen.tsx";
import {ExpensesGroupScreen} from "@/screens/ExpensesGroupScreen.tsx";

export const Navigation = () => {
    const [tokenState] = useToken();
    switch (tokenState.state) {
        case "LOGGED_IN":
        case "REFRESHING":
        case "LOGGED_OUT":
            return (
                <Switch>
                    <Route path="/">
                        <MainScreen/>
                    </Route>
                    <Route path="/login">
                        <LoginScreen/>
                    </Route>
                    <Route path="/signup">
                        <SignupScreen/>
                    </Route>
                    <Route path="/grupos">
                        <GroupSelectionScreen/>
                    </Route>

                    <Route path="/grupos/:id/gastos">
                        <ExpensesGroupScreen />
                    </Route>
                    <Route path="/grupos/:id/reservas">
                        {/* Tu componente de reservas */}
                    </Route>
                    <Route path="/grupos/:id/balance">
                        {/* Tu componente de balance */}
                    </Route>
                    <Route path="/grupos/:id/configuracion">
                        {/* Tu componente de configuración */}
                    </Route>

                    <Route>
                        <Redirect href="/"/>
                    </Route>
                </Switch>
            );
        default:
            // Make the compiler check this is unreachable
            return tokenState satisfies never;
    }
};
