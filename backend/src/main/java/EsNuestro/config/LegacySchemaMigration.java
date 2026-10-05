package EsNuestro.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class LegacySchemaMigration implements ApplicationRunner {

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
    }
}
