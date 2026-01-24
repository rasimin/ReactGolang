package models

import (
	"time"

	"gorm.io/gorm"
)

type Role struct {
	ID          int            `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string         `gorm:"type:varchar(50);unique;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	IsActive    bool           `gorm:"default:true" json:"isActive"`
	CreatedAt   time.Time      `json:"createdAt"`
	CreatedBy   string         `gorm:"type:varchar(100)" json:"createdBy"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	UpdatedBy   string         `gorm:"type:varchar(100)" json:"updatedBy"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
	UserCount   int64          `gorm:"->;dataType:int" json:"userCount"`
}

type RolesResponse struct {
	Data  []Role `json:"data"`
	Total int64  `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}
