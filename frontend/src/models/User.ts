

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