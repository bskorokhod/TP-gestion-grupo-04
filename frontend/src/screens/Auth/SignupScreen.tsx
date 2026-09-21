import TextField from "@/components/Forms/TextField.tsx";
import PasswordField from "@/components/Forms/PasswordField.tsx";
import SubmitButton from "@/components/Forms/SubmitButton.tsx";
import loginIllustration from "@/assets/login.svg";
import {Link} from "wouter";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {useState} from "react";
import {UserCreateSchema} from "@/models/User.ts";
import {supabase, BUCKET_NAME} from "@/lib/supabase.ts";
import {useSignup} from "@/services/AuthServices.ts";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import FileField from "@/components/Forms/FileField.tsx";

export const SignupScreen = () => {
    const [form, setForm] = useState({
        password: "",
        name: "",
        surname: "",
        email: ""
    })

    const { showSchemaError, showApiError, showSuccessToast } = useFormToasts();
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const signup = useSignup();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0])
        }
    }

    const uploadPhoto = async (file: File): Promise<string> => {
        const fileName = `${Date.now()}_${file.name}`

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file)
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let photoUrl: string | undefined
        if (photoFile) {
            photoUrl = await uploadPhoto(photoFile)
        }

        const data = {
            ...form,
            photoUrl
        }

        const parsed = UserCreateSchema.safeParse(data);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? "Datos invalidos";
            showSchemaError(msg);
            return;
        }

        signup.mutate(
            parsed.data,
            {
                onSuccess: () => {
                    showSuccessToast("Cuenta creada correctamente");
                },
                onError: (err) =>
                    showApiError(err, "¡Hubo un problema!")
            }
        )
    }


    return (
        <CommonLayout className="login-backdrop min-h-screen flex flex-col">
            <div className="grid flex-1 xl:grid-cols-2 grid-cols-1 px-5 py-10 sm:px-10 lg:gap-16 lg:px-[8.85vw] lg:py-10">
                <div className="content-center justify-center">
                    <section
                        className="w-full rounded-3xl bg-panel px-7 py-8 shadow-panel sm:px-9 sm:py-10 lg:px-9 lg:py-10"
                        aria-labelledby="login-title"
                    >
                        <p className="text-xl font-light leading-tight text-warm-muted sm:text-2xl">
                            Bienvenido!
                        </p>
                        <h1 id="login-title" className="mt-3 font-display text-3xl font-extrabold leading-none text-ink">
                            Registrate
                        </h1>

                        <form id="login-form" onSubmit={handleSubmit} className="mt-12 sm:mt-5">
                            <TextField
                                id="email"
                                name="email"
                                type="text"
                                label="Email"
                                autoComplete="Email"
                                placeholder="Ingresá tu email" hint={undefined}
                                value={form.email} onChange={handleChange} />

                            <div className="grid grid-cols-2 gap-6">
                                <TextField
                                    id="name"
                                    name="name"
                                    type="text"
                                    label="Nombre(s)"
                                    autoComplete="name"
                                    placeholder="Ingresá tu nombre"
                                    className="mt-10 sm:mt-5" hint={undefined}
                                    value={form.name} onChange={handleChange}/>

                                <TextField
                                    id="surname"
                                    name="surname"
                                    type="text"
                                    label="Apellido(s)"
                                    autoComplete="name"
                                    placeholder="Ingresá tu apellido"
                                    className="mt-10 sm:mt-5" hint={undefined}
                                    value={form.surname} onChange={handleChange}/>
                            </div>

                            <PasswordField
                                id="password"
                                name="password"
                                label="Contraseña"
                                autoComplete="current-password"
                                placeholder="Ingresá tu contraseña"
                                className="mt-10 sm:mt-5"
                                value={form.password} onChange={handleChange}
                            />

                            <FileField
                                id="photoUrl"
                                label="Foto de perfil (opcional)"
                                className="mt-10 sm:mt-5"
                                onChange={handlePhotoChange}
                            />

                            <SubmitButton className="mt-9">Registrate</SubmitButton>
                        </form>

                        <p id="registro" className="mt-4 text-left text-base text-warm-muted">
                            ¿Ya tenes una cuenta?{" "}
                            <Link key="iniciar-sesion" href="/login" className="font-bold text-brand transition-colors hover:text-brand-hover">
                                Iniciar sesión
                            </Link>
                        </p>
                    </section>
                </div>
                <div className="hidden items-center justify-center xl:flex">
                    <img src={loginIllustration} alt='manos chocando en colaboracion'/>
                </div>
            </div>
        </CommonLayout>

    );
}
