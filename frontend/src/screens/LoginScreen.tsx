import { CommonLayout } from "@/components/CommonLayout/CommonLayout";
import { Login } from "@/components/Login/Login";
import { useLogin } from "@/services/UserServices";

export const LoginScreen = () => {
  const { mutate, error } = useLogin();
  return (
    <CommonLayout>
      <Login onSubmit={mutate} submitError={error} />
    </CommonLayout>
  );
};
