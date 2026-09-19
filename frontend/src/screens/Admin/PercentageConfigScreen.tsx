import {PercentageCard} from "@/components/AdminCard";
import {MEMBERS} from "@/models/User.ts";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {GroupNavbar} from "@/components/GroupNavbar.tsx";

export const PercentageConfigScreen = () => {


    return (
        <CommonLayout className="flex flex-col min-h-screen">
            <GroupNavbar children={undefined} groupName=""/>

            <div className="flex flex-col flex-1 gap-6 items-start w-full bg-background pt-12 px-16 pb-16 overflow-hidden">
                <div className="flex flex-col gap-6 self-stretch">
                    {MEMBERS.map((member) => (
                        <PercentageCard
                            key={member.id}
                            member={member} lockState={"locked"}/>
                        )
                    )}
                </div>

                <div className="flex flex-row gap-3 justify-end items-center self-stretch overflow-hidden">
                    <button
                        type="button"
                        className="flex flex-row justify-center items-center bg-panel rounded-[50px] border border-field/60 py-3 px-6 overflow-hidden"
                    >
                        <p className="text-lg font-medium text-ink">Cancelar</p>
                    </button>
                    <button
                        type="button"
                        className="flex flex-row justify-center items-center w-83 h-11 bg-accent/30 rounded-full border border-amber/30 overflow-hidden"
                    >
                        <p className="text-lg font-medium text-ink">
                            Ajustar equitativamente
                        </p>
                    </button>
                    <button
                        type="button"
                        className="flex flex-row justify-center items-center bg-brand rounded-[50px] border border-brand py-3 px-6 overflow-hidden"
                    >
                        <p className="text-lg font-medium text-brand-foreground">
                            Guardar configuración
                        </p>
                    </button>
                </div>
            </div>
        </CommonLayout>
    );
};
