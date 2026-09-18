import TextField from "@/components/Forms/TextField.tsx";
import PasswordField from "@/components/Forms/PasswordField.tsx";
import SubmitButton from "@/components/Forms/SubmitButton.tsx";
import loginIllustration from "@/assets/login.svg";
import {Link} from "wouter";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";

export const SignupScreen = () => {
    function handleSubmit(event: { preventDefault: () => void; }) {
        event.preventDefault();
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
                        <h1
                            id="login-title"
                            className="mt-3 font-display text-3xl font-extrabold leading-none text-ink"
                        >
                            Registrate
                        </h1>

                        <form id="login-form" onSubmit={handleSubmit} className="mt-12 sm:mt-5">
                            <TextField
                                id="email"
                                name="email"
                                type="text"
                                label="Email"
                                autoComplete="Email"
                                placeholder="Ingresá tu email" hint={undefined}/>

                            <div className="grid grid-cols-2 gap-6">
                                <TextField
                                    id="name"
                                    name="name"
                                    type="text"
                                    label="Nombre(s)"
                                    autoComplete="name"
                                    placeholder="Ingresá tu nombre"
                                    className="mt-10 sm:mt-5" hint={undefined}/>

                                <TextField
                                    id="surname"
                                    name="surname"
                                    type="text"
                                    label="Apellido(s)"
                                    autoComplete="name"
                                    placeholder="Ingresá tu apellido"
                                    className="mt-10 sm:mt-5" hint={undefined}/>
                            </div>

                            <PasswordField
                                id="password"
                                name="password"
                                label="Contraseña"
                                autoComplete="current-password"
                                placeholder="Ingresá tu contraseña"
                                className="mt-10 sm:mt-5"
                            />

                            <PasswordField
                                id="repeat_password"
                                name="repeat_password"
                                label="Confirmar contraseña"
                                autoComplete="repeat-current-password"
                                placeholder="Ingresá tu contraseña"
                                className="mt-10 sm:mt-5"
                            />

                            <SubmitButton className="mt-9">Registrate</SubmitButton>
                        </form>

                        <p id="registro" className="mt-4 text-left text-base text-warm-muted">
                            ¿Ya tenes una cuenta?{" "}

                            <Link
                                key="iniciar-sesion"
                                href="/login"
                                className="font-bold text-brand transition-colors hover:text-brand-hover"
                            >
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
