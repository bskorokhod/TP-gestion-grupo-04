package EsNuestro.member;

import java.util.EnumSet;
import java.util.Set;

public enum MembershipStatus {
    REJECTED,
    PENDING,
    ACTIVE,
    /** Se fue del grupo (abandonó): no lo ve, no cuenta y no ocupa identidad. Es definitivo para esa fila. */
    DEACTIVATED;

    public static final Set<MembershipStatus> IDENTITY_OCCUPYING = EnumSet.of(PENDING, ACTIVE);
}
