import { useAppForm } from "@/config/use-app-form";
import { LoginRequest, LoginRequestSchema } from "@/models/Login";

type Props = {
  onSubmit: (value: LoginRequest) => void;
  submitError: Error | null;
};

export function Login({ onSubmit, submitError }: Props) {
  const formData = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onChange: LoginRequestSchema,
    },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <>
      <h1>Log In</h1>
      <formData.AppForm>
        <formData.FormContainer extraError={submitError}>
          <formData.AppField name="username" children={(field) => <field.TextField label="Username" />} />
          <formData.AppField name="password" children={(field) => <field.PasswordField label="Password" />} />
        </formData.FormContainer>
      </formData.AppForm>
    </>
  );
}
