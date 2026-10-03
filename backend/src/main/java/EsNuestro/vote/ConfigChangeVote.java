package EsNuestro.vote;

import EsNuestro.member.GroupMember;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Se vota si cambiar un ajuste del grupo. Siempre requiere unanimidad (sin importar el modelo de votación
 * del grupo) y la ven todos los miembros, no solo unos involucrados.
 * <p>
 * TODO: esqueleto sin terminar. Faltan: el constructor (que fije {@code VotingModel.UNANIMOUS} y cree un
 * ballot por cada miembro activo), el campo propuesto con su valor actual y el propuesto, el endpoint de
 * creación y el {@code VoteExecutor}. Para ejecutarlo, {@code GroupSettings} necesita un método de
 * modificación (hoy es inmutable y no hay endpoint de update).
 */
@Entity
@Table(name = "config_change_votes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConfigChangeVote extends Vote {

    @Override
    public boolean isVisibleTo(GroupMember member) {
        return true;
    }
}
