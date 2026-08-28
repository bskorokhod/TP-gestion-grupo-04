import { useAppForm } from "@/config/use-app-form";
import { BrandCreateRequest, BrandCreateRequestSchema } from "@/models/Brand";

type Props = {
  onSubmit: (value: BrandCreateRequest) => void;
  submitError: Error | null;
};

export const BrandCreate = ({ onSubmit, submitError }: Props) => {
  const formData = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: BrandCreateRequestSchema,
    },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <>
      <h1>Create a new Brand</h1>
      <formData.AppForm>
        <formData.FormContainer extraError={submitError}>
          <formData.AppField name="name" children={(field) => <field.TextField label="Name" />} />
        </formData.FormContainer>
      </formData.AppForm>
    </>
  );
};
