package EsNuestro.common.time;

import java.time.LocalDate;
import java.time.ZoneId;

public final class AppTime {

    public static final String ZONE_ID = "America/Argentina/Buenos_Aires";
    public static final ZoneId ZONE = ZoneId.of(ZONE_ID);

    private AppTime() {
    }

    /**
     * "Hoy" en Buenos Aires, sin importar la zona en la que corra el servidor.
     */
    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
