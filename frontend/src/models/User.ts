import {z} from "zod";

export const UserCreateSchema = z.object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres y un caracter especial -_*+#").max(254).regex(/([-_*+#])+/),
    name: z.string().min(1, "El nombre es obligatorio"),
    surname: z.string().min(1, "El apellido es obligatorio"),
    email: z.email("Email inválido"),
    photoUrl: z.url().optional().nullable()
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

export const VerifiedUserCreateSchema = UserCreateSchema.extend({
    code: z.string().length(6, "El código debe tener exactamente 6 caracteres"),
});

export type VerifiedUserCreate = z.infer<typeof VerifiedUserCreateSchema>;

export const LoginSchema = z.object({
    email: z.string().min(1, "El email es obligatorio"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginRequest = z.infer<typeof LoginSchema>;


export const AuthResponseSchema = z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;


export const UserSchema = z.object({
    email: z.string(),
    name: z.string(),
    role: z.string(),
    surname: z.string(),
    username: z.string(),
});

export type User = z.infer<typeof UserSchema>;


export const UserProfileSchema = z.object({
    name: z.string(),
    surname: z.string(),
    photoUrl: z.url().nullable().catch(null)
});

export type UserProfile = z.infer<typeof UserProfileSchema>;


export const EmailSchema = z.object({
    email: z.email("Ingresá un email válido"),
});

export type Email = z.infer<typeof EmailSchema>;


export const ChangePasswordSchema = z.object({
    token: z.string().min(1, "Token inválido"),
    newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;


export const SimpleUserSchema = z.object({
    username: z.string(),
    name: z.string(),
    surname: z.string(),
});


export const UserPhotoUpdateSchema = z.object({
    newUrl: z.url().nonoptional("Debe seleccionarse un archivo")
});

export type UserPhotoUpdate = z.infer<typeof UserPhotoUpdateSchema>

export interface Member {
    readonly id: string;
    readonly initial: string;
    readonly name: string;
    readonly fullName: string;
    readonly email: string;
    readonly alias: string;
    readonly percentage: number;
}

export const MEMBERS: ReadonlyArray<Member> = [
    {
        id: "111AAA",
        initial: "L",
        name: "Lucia",
        fullName: "Lucia Fernandez",
        email: "luciaf@gmail.com",
        alias: "lucia.fer.mp",
        percentage: 25
    },
    {
        id: "222BBB",
        initial: "R",
        name: "Rocío",
        fullName: "Rocío Nuñez",
        email: "rochi_nu@yahoo.com",
        alias: "rochi",
        percentage: 25
    },
    {
        id: "222BBB",
        initial: "R",
        name: "Rocío",
        fullName: "Rocío Nuñez",
        email: "rochi_nu@yahoo.com",
        alias: "rochi",
        percentage: 25
    },
    {
        id: "333CCC",
        initial: "R",
        name: "Rocío",
        fullName: "Rocío Nuñez",
        email: "rochi_nu@yahoo.com",
        alias: "rochi",
        percentage: 25
    }
]