# Dockerfile
FROM eclipse-temurin:17-jdk-alpine

# 작업 디렉토리 생성
WORKDIR /app

# Maven Wrapper 및 프로젝트 파일 복사
COPY . .

RUN chmod +x mvnw

# 프로젝트 빌드 (JAR 생성)
RUN ./mvnw package -DskipTests

# 실행할 JAR 파일 이름 (target 폴더 안에 생성됨)
CMD ["java", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"]