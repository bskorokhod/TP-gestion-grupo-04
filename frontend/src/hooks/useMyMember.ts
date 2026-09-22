import { useToken } from "@/contexts/TokenContext";
import { TokenService } from "@/services/TokenService";
import { useGetGroupMembers } from "@/services/GroupServices";
import type { Member } from "@/models/Group";

export function useMyMember(groupId?: number): Member | undefined {
    const [tokenState] = useToken();
    const { data: members } = useGetGroupMembers(groupId ?? 0, "ACTIVE");

    if (tokenState.state !== "LOGGED_IN" || !members) return undefined;
    const myUsername = TokenService.getUsernameFromToken(tokenState.tokens.accessToken);
    if (!myUsername) return undefined;
    return members.find((m) => m.username === myUsername);
}