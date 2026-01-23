package main

import (
	"context"
	"database/sql"
	"fmt"
	"go-pertama/config"
	"log"

	_ "github.com/microsoft/go-mssqldb"
)

func main() {
	// Load Configuration
	appConfig, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connection settings from config
	server := appConfig.Database.Host
	user := appConfig.Database.User
	password := appConfig.Database.Password
	port := appConfig.Database.Port

	// Construct connection string for named instance (master DB)
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;database=master", server, user, password)
	if port != "" {
		connString += fmt.Sprintf(";port=%s", port)
	}

	fmt.Printf("Connecting to SQL Server: %s\n", server)
	db, err := sql.Open("sqlserver", connString)
	if err != nil {
		log.Fatal("Error creating connection pool: ", err.Error())
	}
	defer db.Close()

	ctx := context.Background()
	err = db.PingContext(ctx)
	if err != nil {
		log.Fatal("Error pinging database: ", err.Error())
	}
	fmt.Println("Connected to master database!")

	// Create Database
	dbName := appConfig.Database.DBName
	createDbQuery := fmt.Sprintf("IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '%s') BEGIN CREATE DATABASE %s; END", dbName, dbName)
	_, err = db.ExecContext(ctx, createDbQuery)
	if err != nil {
		log.Fatal("Error creating database: ", err.Error())
	}
	fmt.Printf("Database '%s' ensured.\n", dbName)

	// Connect to the new database to create table
	connStringApp := fmt.Sprintf("server=%s;user id=%s;password=%s;database=%s", server, user, password, dbName)
	if port != "" {
		connStringApp += fmt.Sprintf(";port=%s", port)
	}
	dbApp, err := sql.Open("sqlserver", connStringApp)
	if err != nil {
		log.Fatal("Error connecting to app database: ", err.Error())
	}
	defer dbApp.Close()

	// Create Table
	createTableQuery := `
		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
		BEGIN
			CREATE TABLE Users (
				ID INT IDENTITY(1,1) PRIMARY KEY,
				Email NVARCHAR(100) UNIQUE NOT NULL,
				Password NVARCHAR(255) NOT NULL,
				ProfilePicture NVARCHAR(255) NULL,
				CreatedAt DATETIME DEFAULT GETDATE(),
				UpdatedAt DATETIME DEFAULT GETDATE()
			);
		END
		ELSE
		BEGIN
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ProfilePicture')
				ALTER TABLE Users ADD ProfilePicture NVARCHAR(255) NULL;
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'CreatedAt')
				ALTER TABLE Users ADD CreatedAt DATETIME DEFAULT GETDATE();
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'UpdatedAt')
				ALTER TABLE Users ADD UpdatedAt DATETIME DEFAULT GETDATE();
		END
	`
	_, err = dbApp.ExecContext(ctx, createTableQuery)
	if err != nil {
		log.Fatal("Error creating/updating table: ", err.Error())
	}
	fmt.Println("Table 'Users' ensured.")

	// Create Audit Table
	createAuditTableQuery := `
		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActivityLogs' AND xtype='U')
		BEGIN
			CREATE TABLE ActivityLogs (
				ID INT IDENTITY(1,1) PRIMARY KEY,
				UserID INT NULL,
				Action NVARCHAR(50) NOT NULL,
				Details NVARCHAR(MAX) NULL,
				CreatedAt DATETIME DEFAULT GETDATE()
			);
		END
	`
	_, err = dbApp.ExecContext(ctx, createAuditTableQuery)
	if err != nil {
		log.Fatal("Error creating ActivityLogs table: ", err.Error())
	}
	fmt.Println("Table 'ActivityLogs' ensured.")

	// Insert Admin User (Seed)
	insertUserQuery := `
		IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin')
		BEGIN
			INSERT INTO Users (Email, Password) VALUES ('admin', 'admin');
		END
	`
	_, err = dbApp.ExecContext(ctx, insertUserQuery)
	if err != nil {
		log.Fatal("Error seeding admin user: ", err.Error())
	}
	fmt.Println("Admin user ensured.")
}
