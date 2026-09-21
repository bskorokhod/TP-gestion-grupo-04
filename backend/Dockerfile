# Stage 1: Create a jar file from the code
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /home/app
COPY pom.xml pom.xml
RUN mvn dependency:go-offline
COPY . .
RUN mvn package -DskipTests

# Stage 2 (runtime): Run the jar file in a minimal environment
FROM eclipse-temurin:21-jre AS deploy
WORKDIR /home/app
COPY --from=build /home/app/target/EsNuestro-0.0.1-SNAPSHOT.jar /home/app/EsNuestro-0.0.1-SNAPSHOT.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/home/app/EsNuestro-0.0.1-SNAPSHOT.jar"]