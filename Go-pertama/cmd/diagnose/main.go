package main

import (
	"fmt"
	"go-pertama/config"
	"log"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func main() {
	appConfig, _ := config.LoadConfig()
	dsn := fmt.Sprintf("server=%s;user id=%s;password=%s;database=%s",
		appConfig.Database.Host, appConfig.Database.User, appConfig.Database.Password, appConfig.Database.DBName)
	if appConfig.Database.Port != "" {
		dsn += fmt.Sprintf(";port=%s", appConfig.Database.Port)
	}
	db, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var roleIDType string
	db.Raw("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Roles' AND COLUMN_NAME = 'ID'").Scan(&roleIDType)
	log.Printf("Roles.ID type: %s", roleIDType)

	var userRoleIDType string
	db.Raw("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'RoleID'").Scan(&userRoleIDType)
	log.Printf("Users.RoleID type: %s", userRoleIDType)
}
