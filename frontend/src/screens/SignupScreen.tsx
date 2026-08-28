import { CommonLayout } from "@/components/CommonLayout/CommonLayout";
import { useAppForm } from "@/config/use-app-form";
import { SignupRequestSchema } from "@/models/Login";
import { useSignup } from "@/services/UserServices";

export const SignupScreen = () => {
  const { mutate, error } = useSignup();

  const formData = useAppForm({
    defaultValues: {
      username: "",
      password: "",
      role: "USER",
    },
    validators: {
      onChange: SignupRequestSchema,
    },
    onSubmit: async ({ value }) => mutate(value),
  });

  return (
    <CommonLayout>
      <h1>Sign Up</h1>
      <formData.AppForm>
        <formData.FormContainer extraError={error}>
          <formData.AppField name="username" children={(field) => <field.TextField label="Username" />} />
          <formData.AppField name="password" children={(field) => <field.PasswordField label="Password" />} />
          <formData.AppField
            name="role"
            children={(field) => (
              <label>
                <input
                  type="checkbox"
                  checked={field.state.value === "ADMIN"}
                  onChange={() => field.handleChange(field.state.value === "ADMIN" ? "USER" : "ADMIN")}
                />
                Admin
              </label>
            )}
          />
        </formData.FormContainer>
      </formData.AppForm>
    </CommonLayout>
  );
};
