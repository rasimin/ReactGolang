package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	JWT      JWTConfig
	CORS     CORSConfig
}

type AppConfig struct {
	Env     string
	Port    string
	Timeout time.Duration
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	Timeout  time.Duration
}

type JWTConfig struct {
	Secret     string
	ExpiryTime time.Duration
}

type CORSConfig struct {
	AllowedOrigins string
	AllowedMethods string
	AllowedHeaders string
}

func LoadConfig() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using defaults or system env vars")
	}

	config := &Config{
		App: AppConfig{
			Env:     getEnv("APP_ENV", "development"),
			Port:    getEnv("APP_PORT", "8080"),
			Timeout: getDurationEnv("APP_TIMEOUT_SECONDS", 30) * time.Second,
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost\\MSSQLSERVER2022"),
			Port:     getEnv("DB_PORT", ""), // Default to empty for named instances
			User:     getEnv("DB_USER", "appims"),
			Password: getEnv("DB_PASSWORD", "P4ssw0rd"),
			DBName:   getEnv("DB_NAME", "ReactLoginDB"),
			Timeout:  getDurationEnv("DB_TIMEOUT_SECONDS", 10) * time.Second,
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "default-secret-key-change-me"),
			ExpiryTime: getDurationEnv("JWT_EXPIRY_MINUTES", 60) * time.Minute,
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "*"),
			AllowedMethods: getEnv("CORS_ALLOWED_METHODS", "POST, GET, OPTIONS, PUT, DELETE"),
			AllowedHeaders: getEnv("CORS_ALLOWED_HEADERS", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization"),
		},
	}

	return config, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getDurationEnv(key string, fallback int) time.Duration {
	strValue := getEnv(key, "")
	if strValue == "" {
		return time.Duration(fallback)
	}
	if value, err := strconv.Atoi(strValue); err == nil {
		return time.Duration(value)
	}
	return time.Duration(fallback)
}
