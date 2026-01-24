package main

import (
	"fmt"
	"go-pertama/config"
	"go-pertama/models"
	"log"
	"time"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func main() {
	log.Println("Starting manual migration...")

	// Load config
	appConfig, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Error loading config: ", err)
	}

	dsn := fmt.Sprintf("server=%s;user id=%s;password=%s;database=%s",
		appConfig.Database.Host,
		appConfig.Database.User,
		appConfig.Database.Password,
		appConfig.Database.DBName,
	)
	if appConfig.Database.Port != "" {
		dsn += fmt.Sprintf(";port=%s", appConfig.Database.Port)
	}

	db, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Could not connect to database: ", err)
	}

	log.Println("Connected to database successfully.")

	// 1. Migrate Roles table (Create if not exists)
	log.Println("Migrating Roles table...")
	err = db.AutoMigrate(&models.Role{})
	if err != nil {
		log.Fatal("Failed to migrate Roles table: ", err)
	}
	log.Println("Roles table migrated.")

	// 2. Seed Roles
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
			log.Println("Roles seeded.")
		}
	} else {
		log.Println("Roles table already has data.")
	}

	// 3. Alter Users table manually
	log.Println("Checking Users table schema...")

	// Add RoleID column or Alter to BIGINT (Roles.ID is bigint)
	err = db.Exec(`
		IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'RoleID' AND Object_ID = Object_ID(N'Users'))
		BEGIN
			ALTER TABLE Users ADD RoleID BIGINT NULL;
			PRINT 'Added RoleID column (BIGINT) to Users table.';
		END
		ELSE
		BEGIN
			-- Ensure it is BIGINT
			ALTER TABLE Users ALTER COLUMN RoleID BIGINT NULL;
			PRINT 'Ensured RoleID is BIGINT.';
		END
	`).Error
	if err != nil {
		log.Printf("Error configuring RoleID column: %v", err)
	} else {
		log.Println("RoleID column check passed.")
	}

	// Add Foreign Key Constraint
	log.Println("Attempting to add Foreign Key Constraint...")
	err = db.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_Users_Roles') AND parent_object_id = OBJECT_ID(N'Users'))
		BEGIN
			ALTER TABLE Users WITH CHECK ADD CONSTRAINT [FK_Users_Roles] FOREIGN KEY([RoleID])
			REFERENCES [Roles] ([ID]);
			ALTER TABLE Users CHECK CONSTRAINT [FK_Users_Roles];
			PRINT 'FK_Users_Roles created';
		END
	`).Error
	if err != nil {
		log.Printf("Error adding FK_Users_Roles: %v. Attempting to fix data...", err)

		// Fix invalid data: Set RoleID to NULL if it doesn't exist in Roles
		fixResult := db.Exec(`
			UPDATE Users 
			SET RoleID = NULL 
			WHERE RoleID IS NOT NULL 
			AND RoleID NOT IN (SELECT ID FROM Roles)
		`)
		if fixResult.Error == nil {
			log.Printf("Fixed %d users with invalid RoleID.", fixResult.RowsAffected)

			// Retry adding FK
			err = db.Exec(`
				IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_Users_Roles') AND parent_object_id = OBJECT_ID(N'Users'))
				BEGIN
					ALTER TABLE Users WITH CHECK ADD CONSTRAINT [FK_Users_Roles] FOREIGN KEY([RoleID])
					REFERENCES [Roles] ([ID]);
					ALTER TABLE Users CHECK CONSTRAINT [FK_Users_Roles];
					PRINT 'FK_Users_Roles created (retry)';
				END
			`).Error
			if err != nil {
				log.Printf("Retry failed: %v", err)
			} else {
				log.Println("Foreign Key created successfully after data fix.")
			}
		} else {
			log.Printf("Failed to fix data: %v", fixResult.Error)
		}
	} else {
		log.Println("Foreign Key check passed.")
	}

	// 4. Sync Data (Update Users.RoleID based on Users.Role)
	log.Println("Syncing User Roles...")
	// Note: SQL Server specific update with join
	result := db.Exec(`
		UPDATE u
		SET u.RoleID = r.ID
		FROM Users u
		INNER JOIN Roles r ON u.Role = r.Name
		WHERE u.RoleID IS NULL OR u.RoleID = 0
	`)
	if result.Error != nil {
		log.Printf("Error syncing roles: %v", result.Error)
	} else {
		log.Printf("Synced roles for %d users.", result.RowsAffected)
	}

	log.Println("Migration completed successfully.")
}
