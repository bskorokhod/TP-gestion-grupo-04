package EsNuestro.expense.dtos;

import EsNuestro.member.GroupMember;
import EsNuestro.member.MemberColor;

public record ExpenseMemberDTO(
        Long id,
        String nickname,
        MemberColor color
) {
    public static ExpenseMemberDTO from(GroupMember member) {
        return new ExpenseMemberDTO(member.getId(), member.getNickname(), member.getColor());
    }
}
