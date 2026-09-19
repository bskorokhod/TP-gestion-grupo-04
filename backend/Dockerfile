# Stage 1: Create a jar file from the code
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /home/app
COPY pom.xml pom.xml
RUN mvn dependency:resolve-plugins dependency:go-offline
COPY . .
RUN mvn clean package -DskipTests

# Stage 2 (runtime): Run the jar file in a minimal environment
FROM eclipse-temurin:21-jre AS deploy
WORKDIR /home/app
COPY --from=build /home/app/target/*.jar /home/app/app.jar
ENV PORT=8080
EXPOSE ${PORT}
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar /home/app/app.jar"]