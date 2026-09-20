import TextField from "@/components/Forms/TextField.tsx";
import PasswordField from "@/components/Forms/PasswordField.tsx";
import Checkbox from "@/components/Forms/Checkbox.tsx";
import SubmitButton from "@/components/Forms/SubmitButton.tsx";
import loginIllustration from "@/assets/login.svg";
import {Link} from "wouter";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";

export const LoginScreen = () => {
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
                            Bienvenido otra vez!
                        </p>
                        <h1
                            id="login-title"
                            className="mt-3 font-display text-3xl font-extrabold leading-none text-ink"
                        >
                            Iniciá sesión
                        </h1>

                        <form id="login-form" onSubmit={handleSubmit} className="mt-12 sm:mt-5">
                            <TextField
                                id="email"
                                name="email"
                                type="text"
                                label="Email"
                                autoComplete="Email"
                                placeholder="Ingresá tu email" hint={undefined}/>

                            <PasswordField
                                id="password"
                                name="password"
                                label="Contraseña"
                                autoComplete="current-password"
                                placeholder="Ingresá tu contraseña"
                                className="mt-10 sm:mt-5"
                            />

                            <div
                                className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-warm-muted text-base">
                                <Checkbox name="remember">Recordarme</Checkbox>
                                <a href="#recuperar" className="text-right transition-colors hover:text-brand">
                                    Olvidé mi contraseña
                                </a>
                            </div>

                            <SubmitButton className="mt-9">Iniciá sesión</SubmitButton>
                        </form>

                        <p id="registro" className="mt-4 text-left text-base text-warm-muted">
                            ¿No tenés una cuenta ?{" "}

                            <Link
                                key="crear-cuenta"
                                href="/signup"
                                className="font-bold text-brand transition-colors hover:text-brand-hover"
                            >
                                Registrate
                            </Link>

                        </p>
                    </section>
                </div>
                <div className="hidden min-h-155 items-center justify-center xl:flex">
                    <img src={loginIllustration} alt='mySvgImage'/>
                </div>
            </div>
        </CommonLayout>
    );
}