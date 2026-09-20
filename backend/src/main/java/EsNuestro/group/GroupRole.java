package EsNuestro.group;

public enum GroupRole {
    FOUNDER,
    ADMIN,
    MEMBER;

    /**
     * Roles are ordered FOUNDER &gt; ADMIN &gt; MEMBER (lower ordinal = higher rank).
     *
     * @return true if this role has at least the privileges of {@code required}.
     */
    public boolean isAtLeast(GroupRole required) {
        return this.ordinal() <= required.ordinal();
    }
}
