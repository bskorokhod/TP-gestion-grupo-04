import { Redirect, Route, Switch } from "wouter";

import { BrandCreateScreen } from "@/screens/BrandCreateScreen";
import { BrandDetailScreen } from "@/screens/BrandDetailScreen";
import { BrandListScreen } from "@/screens/BrandListScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { MainScreen } from "@/screens/MainScreen";
import { SignupScreen } from "@/screens/SignupScreen";
import { useToken } from "@/services/TokenContext";

export const Navigation = () => {
  const [tokenState] = useToken();
  switch (tokenState.state) {
    case "LOGGED_IN":
    case "REFRESHING":
      return (
        <Switch>
          <Route path="/brands">
            <BrandListScreen />
          </Route>
          <Route path="/brands/new">
            <BrandCreateScreen />
          </Route>
          <Route path="/brands/:id">{({ id }) => <BrandDetailScreen id={id} />}</Route>
          <Route path="/">
            <MainScreen />
          </Route>
          <Route>
            <Redirect href="/" />
          </Route>
        </Switch>
      );
    case "LOGGED_OUT":
      return (
        <Switch>
          <Route path="/login">
            <LoginScreen />
          </Route>
          <Route path="/signup">
            <SignupScreen />
          </Route>
          <Route>
            <Redirect href="/signup" />
          </Route>
        </Switch>
      );
    default:
      // Make the compiler check this is unreachable
      return tokenState satisfies never;
  }
};
