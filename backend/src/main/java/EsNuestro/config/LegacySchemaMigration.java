package EsNuestro.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class LegacySchemaMigration implements ApplicationRunner {

    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(LegacySchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public LegacySchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE group_members DROP COLUMN IF EXISTS role");
        // ddl-auto=update no modifica los check de los enums ya creados: sin esto una base anterior a
        // ExpenseStatus.CANCELLED rechaza la eliminación lógica de un gasto.
        jdbcTemplate.execute("ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check");
        // Lo mismo con ExpenseCategory: la lista de categorías va a cambiar y el check creado la primera vez no se actualiza.
        jdbcTemplate.execute("ALTER TABLE expense_details DROP CONSTRAINT IF EXISTS expense_details_category_check");
        // Lo mismo con DebtStatus: una base anterior a DebtStatus.CANCELED rechaza cancelar deudas al abandonar un grupo.
        jdbcTemplate.execute("ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_status_check");
        migrateMembershipStatuses();
    }

    /**
     * MembershipStatus perdió LEFT y REMOVED: quien se fue queda DEACTIVATED y, si vuelve, reutiliza su fila.
     */
    private void migrateMembershipStatuses() {
        jdbcTemplate.execute("ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_status_check");
        jdbcTemplate.execute("ALTER TABLE group_members DROP COLUMN IF EXISTS exit_reason");
        // Los índices parciales y el reemplazo de valores sobre el enum son de Postgres; H2 (tests) arranca de cero.
        if (isPostgres()) {
            jdbcTemplate.execute(
                    "UPDATE group_members SET status = 'DEACTIVATED', percentage = NULL WHERE status IN ('LEFT', 'REMOVED')");
            // Una sola fila por (grupo, usuario): quien vuelve reutiliza la suya. Se reemplaza el índice parcial de una
            // versión anterior. Si una base local tiene duplicados (de esa versión) no se consolida (las filas tienen
            // deudas, votos y reservas asociados): se avisa y no se crea el índice, sin romper el arranque.
            jdbcTemplate.execute("DROP INDEX IF EXISTS uk_group_member_user_current");
            Integer duplicates = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM (SELECT 1 FROM group_members GROUP BY group_id, user_id HAVING COUNT(*) > 1) d",
                    Integer.class);
            if (duplicates != null && duplicates > 0) {
                LOG.warn("group_members tiene {} pares (group_id, user_id) duplicados: no se crea el índice único", duplicates);
            } else {
                jdbcTemplate.execute(
                        "CREATE UNIQUE INDEX IF NOT EXISTS uk_group_member_user ON group_members (group_id, user_id)");
            }
        }
    }

    private boolean isPostgres() {
        return Boolean.TRUE.equals(jdbcTemplate.execute((java.sql.Connection connection) ->
                "PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName())));
    }
}
