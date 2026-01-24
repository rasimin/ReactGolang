package models

import (
	"time"

	"gorm.io/gorm"
)

type DataType string

const (
	TypeString  DataType = "string"
	TypeInteger DataType = "integer"
	TypeBoolean DataType = "boolean"
	TypeFloat   DataType = "float"
	TypeJSON    DataType = "json"
)

type SystemConfig struct {
	ID               int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	ConfigKey        string         `gorm:"type:varchar(255);unique;not null" json:"configKey"`
	DataType         DataType       `gorm:"type:varchar(20);not null" json:"dataType"`
	MainValue        string         `gorm:"type:text" json:"mainValue"`
	AlternativeValue string         `gorm:"type:text" json:"alternativeValue"`
	Description      string         `gorm:"type:text" json:"description"`
	IsActive         bool           `gorm:"default:true" json:"isActive"`
	CreatedAt        time.Time      `json:"createdAt"`
	CreatedBy        string         `gorm:"type:varchar(100)" json:"createdBy"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	UpdatedBy        string         `gorm:"type:varchar(100)" json:"updatedBy"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
}

type SystemConfigHistory struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	ConfigID     int64     `gorm:"index;not null" json:"configId"`
	SystemConfig SystemConfig `gorm:"foreignKey:ConfigID" json:"-"`
	OldValue     string    `gorm:"type:text" json:"oldValue"`
	NewValue     string    `gorm:"type:text" json:"newValue"`
	ChangeReason string    `gorm:"type:text" json:"changeReason"`
	ChangedAt    time.Time `json:"changedAt"`
	ChangedBy    string    `gorm:"type:varchar(100)" json:"changedBy"`
	IPAddress    string    `gorm:"type:varchar(50)" json:"ipAddress"`
}
