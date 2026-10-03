package EsNuestro.vote;

import EsNuestro.group.Group;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Al aprobarse, aplica el cambio de configuración sobre el grupo. El valor se aplica sobre la configuración
 * vigente en ese momento: si otra votación cambió algo mientras tanto y la combinación ya no es coherente,
 * devuelve el motivo y la votación queda con resultado EXECUTION_FAILED.
 */
@Component
class ConfigChangeVoteExecutor implements VoteExecutor {

    @Override
    public VoteType type() {
        return VoteType.CONFIG_CHANGE;
    }

    @Override
    public Optional<String> execute(Vote vote) {
        if (!(vote instanceof ConfigChangeVote configVote)) {
            throw new IllegalStateException("Vote " + vote.getId() + " is not a config change vote");
        }
        Group group = configVote.getGroup();
        try {
            group.changeSettings(configVote.applyTo(group.getSettings()));
        } catch (IllegalArgumentException e) {
            return Optional.of(e.getMessage());
        }
        return Optional.empty();
    }
}
