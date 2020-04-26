# planning-poker
This is a simple planning poker application.

# Building the application
Launch the Maven build on the checked out sources of this demo:
```./mvnw install```

# Live coding with Quarkus
The Maven Quarkus plugin provides a development mode that supports live coding. To try this out:
```./mvnw quarkus:dev```

# Run Quarkus in JVM mode
When you're done iterating in developer mode, you can run the application as a conventional jar file.
First compile it:
```./mvnw install```
Then run it:
```java -jar ./target/planning-poker-1.0-SNAPSHOT-runner.jar```

# Endpoint URL
```http://127.0.0.1:9090/poker.html```
