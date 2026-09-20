package EsNuestro.group;

import java.util.EnumSet;
import java.util.Set;

public enum MembershipStatus {
    REJECTED,
    PENDING,
    ACTIVE,
    DEACTIVATED,
    LEFT,
    REMOVED;

    static final Set<MembershipStatus> IDENTITY_OCCUPYING = EnumSet.of(PENDING, ACTIVE, DEACTIVATED);
    static final Set<MembershipStatus> OWNERSHIP_HOLDING = EnumSet.of(ACTIVE, DEACTIVATED);
}