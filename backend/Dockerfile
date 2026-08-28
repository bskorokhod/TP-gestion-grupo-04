# Stage 1: Create a jar file from the code
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /home/app
COPY pom.xml pom.xml
RUN mvn dependency:resolve-plugins dependency:go-offline
COPY . .
RUN mvn package -DskipTests

# Stage 2 (runtime): Run the jar file in a minimal environment
FROM eclipse-temurin:21-jre AS deploy
WORKDIR /home/app
COPY --from=build /home/app/target/product-template-0.0.1-SNAPSHOT.jar /home/app/product-template-0.0.1-SNAPSHOT.jar
EXPOSE 8080
HEALTHCHECK \
    --timeout=5s --interval=10s --retries=5 \
    --start-period=30s --start-interval=10s \
    CMD curl --fail --silent http://localhost:8081/actuator/health | grep UP || exit 1
ENTRYPOINT ["java","-jar","/home/app/product-template-0.0.1-SNAPSHOT.jar"]