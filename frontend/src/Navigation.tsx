import {Redirect, Route, Switch} from "wouter";

import {MainScreen} from "@/screens/MainScreen";
import {useToken} from "@/contexts/TokenContext.tsx";
import {LoginScreen} from "@/screens/Auth/LoginScreen.tsx";
import {SignupScreen} from "@/screens/Auth/SignupScreen.tsx";
import {GroupSelectionScreen} from "@/screens/GroupSelectionScreen.tsx";
import {ExpensesGroupScreen} from "@/screens/Group/ExpensesGroupScreen.tsx";
import {UnderConstructionGroupScreen} from "@/screens/UnderConstructionGroupScreen";
import {ConfigurationScreen} from "@/screens/Admin/ConfigurationScreen.tsx";
import {PercentageConfigScreen} from "@/screens/Admin/PercentageConfigScreen.tsx";

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
                        <ExpensesGroupScreen/>
                    </Route>
                    <Route path="/grupos/:id/reservas">
                        <UnderConstructionGroupScreen/>
                    </Route>
                    <Route path="/grupos/:id/balance">
                        <UnderConstructionGroupScreen/>
                    </Route>

                    <Route path="/grupos/:id/configuracion">
                        <ConfigurationScreen/>
                    </Route>
                    <Route path="/grupos/:id/configuracion/porcentajes">
                        <PercentageConfigScreen/>
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
