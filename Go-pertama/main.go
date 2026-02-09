package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

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
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'RoleID' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD RoleID BIGINT NULL;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'Avatar' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD Avatar VARBINARY(MAX) NULL;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'AvatarType' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD AvatarType NVARCHAR(50) NULL;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'IsLoggedIn' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD IsLoggedIn BIT DEFAULT 0 WITH VALUES;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'CreatedBy' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD CreatedBy NVARCHAR(100) NULL;`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'UpdatedBy' AND Object_ID = Object_ID(N'Users'))
		 ALTER TABLE Users ADD UpdatedBy NVARCHAR(100) NULL;`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActivityLogs' and xtype='U')
		 CREATE TABLE ActivityLogs (
			ID INT IDENTITY(1,1) PRIMARY KEY,
			UserID INT NOT NULL,
			Action NVARCHAR(100) NOT NULL,
			Details NVARCHAR(MAX),
			CreatedAt DATETIME DEFAULT GETDATE()
		 );`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserHistory' and xtype='U')
		 CREATE TABLE UserHistory (
			ID INT IDENTITY(1,1) PRIMARY KEY,
			UserID INT NOT NULL,
			Email NVARCHAR(255),
			Name NVARCHAR(100),
			Role NVARCHAR(50),
			RoleID BIGINT,
			IsActive BIT,
			Action NVARCHAR(50),
			ChangedBy NVARCHAR(100),
			ChangedAt DATETIME DEFAULT GETDATE()
		 );`,
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
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err = db.PingContext(ctx)
	if err != nil {
		fmt.Printf("Warning: Could not connect to SQL Server: %s\n", err.Error())
		fmt.Println("Please ensure SQL Server is running, TCP/IP is enabled, and the database exists.")
	} else {
		fmt.Println("Successfully connected to SQL Server!")
		migrateDB()
		seedDB()
	}
}

func seedRoles(db *gorm.DB) {
	var count int64
	db.Model(&models.Role{}).Count(&count)
	if count == 0 {
		log.Println("Seeding roles...")
		roles := []models.Role{
			{Name: "admin", Description: "Administrator", CreatedBy: "System", CreatedAt: time.Now(), UpdatedAt: time.Now(), UpdatedBy: "System"},
			{Name: "user", Description: "Standard User", CreatedBy: "System", CreatedAt: time.Now(), UpdatedAt: time.Now(), UpdatedBy: "System"},
		}
		if err := db.Create(&roles).Error; err != nil {
			log.Printf("Failed to seed roles: %v", err)
		} else {
			log.Println("Roles seeded successfully.")
		}
	}
}

func initGorm() {
	fmt.Println("initGorm: Starting...")
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
	fmt.Println("initGorm: Opening connection...")
	gormDB, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Warning: Could not connect to SQL Server via GORM: %v\n", err)
		return
	}
	fmt.Println("initGorm: Connection opened.")

	// Auto Migrate SystemConfig and Role
	// Note: User migration is handled by manual SQL in migrateDB for now to preserve existing logic
	fmt.Println("initGorm: AutoMigrating...")
	err = gormDB.AutoMigrate(&models.SystemConfig{}, &models.SystemConfigHistory{}, &models.Role{})
	if err != nil {
		fmt.Printf("Warning: AutoMigrate failed: %v\n", err)
	}
	fmt.Println("initGorm: AutoMigrate done.")

	seedRoles(gormDB)
	seedConfigDB(gormDB)

	// Sync User Roles (Update RoleID based on Role string)
	gormDB.Exec("UPDATE Users SET RoleID = (SELECT id FROM roles WHERE roles.name = Users.Role) WHERE RoleID IS NULL OR RoleID = 0")
	fmt.Println("initGorm: Finished.")
}

// seedConfigDB seeds the system_configs table with default values if empty
func seedConfigDB(db *gorm.DB) {
	configs := []models.SystemConfig{
		{ConfigKey: "site_name", MainValue: "My App", Description: "The name of the application", DataType: models.TypeString},
		{ConfigKey: "maintenance_mode", MainValue: "false", Description: "Enable/disable maintenance mode", DataType: models.TypeBoolean},
		{ConfigKey: "max_upload_size", MainValue: "10MB", Description: "Maximum file upload size", DataType: models.TypeString},
		{ConfigKey: "theme", MainValue: "light", Description: "Default UI theme", DataType: models.TypeString},
		{ConfigKey: "pagination_limit", MainValue: "5", Description: "Default number of items per page for pagination", DataType: models.TypeInteger},
	}

	for _, config := range configs {
		var count int64
		db.Model(&models.SystemConfig{}).Where("config_key = ?", config.ConfigKey).Count(&count)
		if count == 0 {
			if err := db.Create(&config).Error; err != nil {
				log.Printf("Failed to seed config %s: %v", config.ConfigKey, err)
			} else {
				log.Printf("Seeded config: %s", config.ConfigKey)
			}
		}
	}
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic: %v\n", r)
			os.Exit(1)
		}
	}()

	fmt.Println("Starting Main...")
	// Load configuration
	var err error
	appConfig, err = config.LoadConfig()
	if err != nil {
		log.Fatal("Error loading config: ", err)
	}

	// Initialize Database
	fmt.Println("Initializing DB...")
	initDB()
	fmt.Println("Initializing GORM...")
	initGorm()
	fmt.Println("Initializing Repositories...")

	// Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	configRepo := repository.NewConfigRepository(gormDB)
	roleRepo := repository.NewRoleRepository(gormDB)

	// Initialize Services
	userService := services.NewUserService(userRepo)
	authService := services.NewAuthService(userRepo, appConfig)
	configService := services.NewConfigService(configRepo)
	roleService := services.NewRoleService(roleRepo)

	// Initialize Handlers
	userHandler := handlers.NewUserHandler(userService)
	authHandler := handlers.NewAuthHandler(authService)
	configHandler := handlers.NewConfigHandler(configService)
	changeLogHandler := handlers.NewChangeLogHandler()
	roleHandler := handlers.NewRoleHandler(roleService)
	reportHandler := handlers.NewReportHandler()

	// Initialize Middleware
	authMiddleware := middleware.AuthMiddleware(db)

	mux := http.NewServeMux()

	// Auth Routes
	mux.HandleFunc("/login", middleware.EnableCORS(authHandler.Login))
	mux.HandleFunc("/logout", middleware.EnableCORS(authMiddleware(authHandler.Logout)))
	mux.HandleFunc("/change-password", middleware.EnableCORS(authMiddleware(authHandler.ChangePassword)))

	// User Routes
	mux.HandleFunc("/api/profile", middleware.EnableCORS(authMiddleware(userHandler.GetProfile)))
	mux.HandleFunc("/api/profile/activity", middleware.EnableCORS(authMiddleware(userHandler.GetActivityLogs)))
	mux.HandleFunc("/api/activity-logs", middleware.EnableCORS(authMiddleware(userHandler.GetSystemActivityLogs)))
	mux.HandleFunc("/api/activity-logs/export", middleware.EnableCORS(authMiddleware(userHandler.ExportActivityLogs)))
	mux.HandleFunc("/api/users/active", middleware.EnableCORS(authMiddleware(userHandler.GetActiveUsers)))
	mux.HandleFunc("/api/users/kick", middleware.EnableCORS(authMiddleware(userHandler.KickUser)))
	mux.HandleFunc("/api/users/history", middleware.EnableCORS(authMiddleware(userHandler.GetUserHistory)))
	mux.HandleFunc("/api/users", middleware.EnableCORS(authMiddleware(func(w http.ResponseWriter, r *http.Request) {
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

	mux.HandleFunc("/api/users/reset-counter", middleware.EnableCORS(authMiddleware(userHandler.ResetFailedAttempts)))

	mux.HandleFunc("/upload", middleware.EnableCORS(authMiddleware(userHandler.UploadProfilePicture)))
	mux.HandleFunc("/api/avatar/remove", middleware.EnableCORS(authMiddleware(userHandler.RemoveAvatar)))
	mux.HandleFunc("/api/avatar", middleware.EnableCORS(userHandler.GetAvatar))

	// Report Route
	mux.HandleFunc("/api/upload-summary", middleware.EnableCORS(authMiddleware(reportHandler.UploadSummary)))

	// Change Log Route
	mux.HandleFunc("/api/changelog", middleware.EnableCORS(authMiddleware(changeLogHandler.GetChangeLog)))

	// Role Routes
	mux.HandleFunc("/api/roles", middleware.EnableCORS(authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			roleHandler.GetRoles(w, r)
		} else if r.Method == http.MethodPost {
			roleHandler.CreateRole(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/roles/", middleware.EnableCORS(authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		// Handle /api/roles/{id}
		if len(path) > len("/api/roles/") {
			if r.Method == http.MethodGet {
				roleHandler.GetRole(w, r)
				return
			} else if r.Method == http.MethodPut {
				roleHandler.UpdateRole(w, r)
				return
			} else if r.Method == http.MethodDelete {
				roleHandler.DeleteRole(w, r)
				return
			}
		}
		http.NotFound(w, r)
	})))

	// Config Routes
	mux.HandleFunc("/api/configs", middleware.EnableCORS(authMiddleware(func(w http.ResponseWriter, r *http.Request) {
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

	mux.HandleFunc("/api/configs/", middleware.EnableCORS(authMiddleware(func(w http.ResponseWriter, r *http.Request) {
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

	port := "8081"
	fmt.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		fmt.Printf("FATAL ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("Exiting main...")
}
