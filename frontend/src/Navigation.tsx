import {Redirect, Route, Switch} from "wouter";

import {MainScreen} from "@/screens/MainScreen";
import {useToken} from "@/services/TokenContext";
import {LoginScreen} from "@/screens/Auth/LoginScreen.tsx";
import {SignupScreen} from "@/screens/Auth/SignupScreen.tsx";
import {GroupsScreen} from "@/screens/GroupsScreen.tsx";

export const Navigation = () => {
    const [tokenState] = useToken();
    switch (tokenState.state) {
        case "LOGGED_IN":
        case "REFRESHING":
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
                        <GroupsScreen/>
                    </Route>
                    <Route>
                        <Redirect href="/"/>
                    </Route>
                </Switch>
            );
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
                        <GroupsScreen/>
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
