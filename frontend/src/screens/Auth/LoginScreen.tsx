import Navbar from "@/components/Navbar.tsx";
import TextField from "@/components/TextField.tsx";
import PasswordField from "@/components/PasswordField.tsx";
import Checkbox from "@/components/Checkbox.tsx";
import SubmitButton from "@/components/SubmitButton.tsx";
import loginIllustration from "@/assets/login.svg";

export const LoginScreen = () => {
    function handleSubmit(event: { preventDefault: () => void; }) {
        event.preventDefault();
    }

    return (
        <main className="login-backdrop min-h-screen">
            <Navbar/>
            <div
                className="grid min-h-[calc(100vh-5rem)] grid-cols-1 px-5 py-10 sm:px-10 lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[32rem_minmax(0,1fr)] lg:gap-16 lg:px-[8.85vw] lg:py-10">
                <div className="flex items-center justify-center lg:justify-start">
                    <section
                        className="w-full max-w-lg rounded-3xl bg-panel px-7 py-8 shadow-panel sm:px-9 sm:py-10 lg:px-9 lg:py-10"
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
                                placeholder="Ingresá tu email"
                            />

                            <PasswordField
                                id="password"
                                name="password"
                                label="Contraseña"
                                autoComplete="current-password"
                                placeholder="Ingresá tu contraseña"
                                className="mt-10 sm:mt-5"
                            />

                            <div
                                className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-warm-muted">
                                <Checkbox name="remember">Recordarme</Checkbox>
                                <a href="#recuperar" className="text-right transition-colors hover:text-brand">
                                    Olvidé mi contraseña
                                </a>
                            </div>

                            <SubmitButton className="mt-9">Iniciá sesión</SubmitButton>
                        </form>

                        <p id="registro" className="mt-4 text-left text-sm text-warm-muted">
                            ¿No tenés una cuenta ?{" "}
                            <a href="#crear-cuenta"
                               className="font-bold text-brand transition-colors hover:text-brand-hover">
                                Registrate
                            </a>
                        </p>
                    </section>
                </div>
                <div
                    className="hidden min-h-155 items-center justify-center lg:flex"
                >
                    <img src={loginIllustration} alt='mySvgImage'/>
                </div>
            </div>
        </main>
    );
}