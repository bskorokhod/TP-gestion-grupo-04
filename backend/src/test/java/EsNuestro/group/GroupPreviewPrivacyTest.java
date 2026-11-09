package EsNuestro.group;

import EsNuestro.group.dtos.GroupPreviewDTO;
import org.junit.jupiter.api.Test;

import java.lang.reflect.RecordComponent;
import java.math.BigDecimal;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class GroupPreviewPrivacyTest {

    @Test
    void thePreviewOnlyExposesTheDistributionMode() {
        Group group = new Group("Casa secreta", "Descripción", "ABC-1234-XYZ", new GroupSettings(
                DistributionMode.PERCENTAGE, VotingModel.SIMPLE_MAJORITY, ReservationLimitPolicy.EQUAL, null,
                new BigDecimal("1000")));

        GroupPreviewDTO preview = GroupPreviewDTO.from(group);

        assertThat(preview.distributionMode()).isEqualTo(DistributionMode.PERCENTAGE);
        assertThat(Arrays.stream(GroupPreviewDTO.class.getRecordComponents()).map(RecordComponent::getName))
                .containsExactly("distributionMode");
    }
}
