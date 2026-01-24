package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"go-pertama/config"
	"go-pertama/handlers"
	"go-pertama/middleware"
	"go-pertama/models"
	"go-pertama/repository"
	"go-pertama/services"

	_ "github.com/microsoft/go-mssqldb"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

// Global configuration
var appConfig *config.Config

// Global database connection pool
var db *sql.DB
var gormDB *gorm.DB

func migrateDB() {
	// Add new columns if they don't exist
	queries := []string{
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'IsActive' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD IsActive BIT DEFAULT 1 WITH VALUES;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'LastLogin' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD LastLogin DATETIME NULL;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'LastLogout' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD LastLogout DATETIME NULL;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'FailedLoginAttempts' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD FailedLoginAttempts INT DEFAULT 0 WITH VALUES;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'Name' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD Name NVARCHAR(100) DEFAULT 'User' WITH VALUES;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'Role' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD Role VARCHAR(50) DEFAULT 'user' WITH VALUES;`,
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Printf("Migration warning: %v", err)
		}
	}
	log.Println("Database migration checked/completed.")
}

func seedDB() {
	var adminExists int
	// Check if admin user exists specifically
	err := db.QueryRow("SELECT CASE WHEN EXISTS(SELECT 1 FROM Users WHERE Email = 'admin@example.com') THEN 1 ELSE 0 END").Scan(&adminExists)
	if err != nil {
		log.Printf("Error checking for admin user: %v", err)
		return
	}

	if adminExists == 0 {
		log.Println("Admin user missing. Seeding default admin user...")

		password := "password123"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error hashing password: %v", err)
			return
		}

		// Try to insert with Name and Role first
		// We use dynamic SQL or try-catch logic here by attempting insert
		query := `
			INSERT INTO Users (Email, Password, Name, Role, IsActive, CreatedAt)
			VALUES ('admin@example.com', @p1, 'Admin User', 'admin', 1, GETDATE())
		`
		_, err = db.Exec(query, string(hashedPassword))
		if err != nil {
			log.Printf("Failed to seed with Name/Role columns: %v. Retrying with basic columns...", err)

			// Fallback to basic columns if Name/Role don't exist
			queryBasic := `
				INSERT INTO Users (Email, Password, IsActive)
				VALUES ('admin@example.com', @p1, 1)
			`
			_, err = db.Exec(queryBasic, string(hashedPassword))
			if err != nil {
				log.Printf("Failed to seed database: %v", err)
				return
			}
		}

		log.Println("---------------------------------------------------------")
		log.Println("DEFAULT USER RESTORED SUCCESSFULLY")
		log.Println("Email:    admin@example.com")
		log.Println("Password: password123")
		log.Println("---------------------------------------------------------")
	} else {
		log.Println("Admin user already exists. Skipping seed.")
	}
}

func initDB() {
	// Connection string (DSN format)
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;database=%s",
		appConfig.Database.Host,
		appConfig.Database.User,
		appConfig.Database.Password,
		appConfig.Database.DBName,
	)

	// Add port if specified
	if appConfig.Database.Port != "" {
		connString += fmt.Sprintf(";port=%s", appConfig.Database.Port)
	}

	var err error
	db, err = sql.Open("sqlserver", connString)
	if err != nil {
		log.Fatal("Error creating connection pool: ", err.Error())
	}

	// Verify connection
	err = db.Ping()
	if err != nil {
		fmt.Printf("Warning: Could not connect to SQL Server: %s\n", err.Error())
		fmt.Println("Please ensure SQL Server is running, TCP/IP is enabled, and the database exists.")
	} else {
		fmt.Println("Successfully connected to SQL Server!")
		migrateDB()
		seedDB()
	}
}

func initGorm() {
	dsn := fmt.Sprintf("server=%s;user id=%s;password=%s;database=%s",
		appConfig.Database.Host,
		appConfig.Database.User,
		appConfig.Database.Password,
		appConfig.Database.DBName,
	)
	if appConfig.Database.Port != "" {
		dsn += fmt.Sprintf(";port=%s", appConfig.Database.Port)
	}

	var err error
	gormDB, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("Warning: Could not connect to SQL Server via GORM: %v", err)
		return
	}

	// Auto Migrate SystemConfig
	// Note: User migration is handled by manual SQL in migrateDB for now to preserve existing logic
	err = gormDB.AutoMigrate(&models.SystemConfig{}, &models.SystemConfigHistory{})
	if err != nil {
		log.Printf("Warning: AutoMigrate failed: %v", err)
	}

	seedConfigDB(gormDB)
}

// seedConfigDB seeds the system_configs table with default values if empty
func seedConfigDB(db *gorm.DB) {
	var count int64
	db.Model(&models.SystemConfig{}).Count(&count)
	if count == 0 {
		log.Println("Seeding system_configs...")
		configs := []models.SystemConfig{
			{ConfigKey: "site_name", MainValue: "My App", Description: "The name of the application"},
			{ConfigKey: "maintenance_mode", MainValue: "false", Description: "Enable/disable maintenance mode"},
			{ConfigKey: "max_upload_size", MainValue: "10MB", Description: "Maximum file upload size"},
			{ConfigKey: "theme", MainValue: "light", Description: "Default UI theme"},
		}
		if err := db.Create(&configs).Error; err != nil {
			log.Printf("Failed to seed system_configs: %v", err)
		} else {
			log.Println("System configs seeded successfully.")
		}
	}
}

func main() {
	// Load configuration
	var err error
	appConfig, err = config.LoadConfig()
	if err != nil {
		log.Fatal("Error loading config: ", err)
	}

	// Initialize Database
	initDB()
	initGorm()

	// Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	configRepo := repository.NewConfigRepository(gormDB)

	// Initialize Services
	userService := services.NewUserService(userRepo)
	authService := services.NewAuthService(userRepo, appConfig)
	configService := services.NewConfigService(configRepo)

	// Initialize Handlers
	userHandler := handlers.NewUserHandler(userService)
	authHandler := handlers.NewAuthHandler(authService)
	configHandler := handlers.NewConfigHandler(configService)
	changeLogHandler := handlers.NewChangeLogHandler()

	mux := http.NewServeMux()

	// Auth Routes
	mux.HandleFunc("/login", middleware.EnableCORS(authHandler.Login))
	mux.HandleFunc("/logout", middleware.EnableCORS(middleware.AuthMiddleware(authHandler.Logout)))
	mux.HandleFunc("/change-password", middleware.EnableCORS(middleware.AuthMiddleware(authHandler.ChangePassword)))

	// User Routes
	mux.HandleFunc("/api/profile", middleware.EnableCORS(middleware.AuthMiddleware(userHandler.GetProfile)))
	mux.HandleFunc("/api/users", middleware.EnableCORS(middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			userHandler.GetUsers(w, r)
		} else if r.Method == http.MethodPost {
			userHandler.CreateUser(w, r)
		} else if r.Method == http.MethodPut {
			userHandler.UpdateUser(w, r)
		} else if r.Method == http.MethodDelete {
			userHandler.DeleteUser(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/upload", middleware.EnableCORS(middleware.AuthMiddleware(userHandler.UploadProfilePicture)))

	// Change Log Route
	mux.HandleFunc("/api/changelog", middleware.EnableCORS(middleware.AuthMiddleware(changeLogHandler.GetChangeLog)))

	// Config Routes
	mux.HandleFunc("/api/configs", middleware.EnableCORS(middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/configs" {
			if r.Method == http.MethodGet {
				configHandler.GetConfigs(w, r)
			} else if r.Method == http.MethodPost {
				configHandler.CreateConfig(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		} else {
			http.NotFound(w, r)
		}
	})))

	mux.HandleFunc("/api/configs/", middleware.EnableCORS(middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Handle /api/configs/{id}/history
		// Check this FIRST because it's more specific than /api/configs/{id}
		if strings.HasSuffix(path, "/history") && r.Method == http.MethodGet {
			configHandler.GetHistory(w, r)
			return
		}

		// Handle /api/configs/{id}
		if len(path) > len("/api/configs/") {
			if r.Method == http.MethodGet {
				configHandler.GetConfig(w, r)
				return
			} else if r.Method == http.MethodPut {
				configHandler.UpdateConfig(w, r)
				return
			} else if r.Method == http.MethodDelete {
				configHandler.DeleteConfig(w, r)
				return
			}
		}

		http.NotFound(w, r)
	})))

	// Serve Static Files
	fs := http.FileServer(http.Dir("../react-pertama"))
	mux.Handle("/", fs)

	// Serve Uploaded Files
	// Create uploads directory if it doesn't exist
	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", 0755)
	}
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	port := "8080"
	fmt.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
