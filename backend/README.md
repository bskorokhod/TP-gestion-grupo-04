# Backend

This is a combination of things that can be used as they are, and incredibly contrived examples.

## To run

### Compile

```bash
mvn package -DskipTests
```

This will produce a jar file inside the target dir, using the project name.
By default, this is `product-template-0.0.1-SNAPSHOT.jar`

Also by default, `mvn package` will run tests before packaging the executable.
`-DskipTests` will allow for faster packaging, assuming that tests are already
known to be successful.

### Execute

1. Configure a database in [application.properties](src/main/resources/application.properties).
   The default database is the one exposed by the docker-compose, which can be started with

   ```bash
   docker-compose up -d db
   ```

2. After compiling:

   ```bash
   java -jar target/product-template-0.0.1-SNAPSHOT.jar
   ```

3. If both are running, you should be able to access the swagger docs and run requests

### Swagger/OpenAPI

This project generates swagger docs from annotations on source code. These may also be used to call endpoints.

Depending on environment:

- Dev: http://localhost:8080/swagger-ui/index.html
- Local Docker: http://localhost:20000/api/swagger-ui/index.html
- Cloud: https://grupo-00.tp1.ingsoft1.fiuba.ar/api/swagger-ui/index.html

You may need to replace these numbers depending on your environment's configuration

### Tests

```bash
mvn verify
```

Coverage report will be generated in [target/site/jacoco/index.html](./target/site/jacoco/index.html)

## Reference

### Reference Documentation

For further reference, please consider the following sections:

- [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
- [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/3.4.3/maven-plugin)
- [Spring Web](https://docs.spring.io/spring-boot/3.4.3/reference/web/servlet.html)
- [Spring Security](https://docs.spring.io/spring-boot/3.4.3/reference/web/spring-security.html)
- [Spring Data JPA](https://docs.spring.io/spring-boot/3.4.3/reference/data/sql.html#data.sql.jpa-and-spring-data)

### Guides

The following guides illustrate how to use some features concretely:

- [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
- [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
- [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
- [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
- [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
- [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
- [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.
