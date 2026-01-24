package repository

import (
	"go-pertama/models"
	"gorm.io/gorm"
)

type ConfigRepository interface {
	FindAll(search string, typeFilter string, page, limit int) ([]models.SystemConfig, int64, error)
	FindByID(id int64) (*models.SystemConfig, error)
	FindByKey(key string) (*models.SystemConfig, error)
	Create(config *models.SystemConfig) error
	Update(config *models.SystemConfig) error
	Delete(id int64) error
	CreateHistory(history *models.SystemConfigHistory) error
	GetHistory(configID int64) ([]models.SystemConfigHistory, error)
}

type configRepository struct {
	db *gorm.DB
}

func NewConfigRepository(db *gorm.DB) ConfigRepository {
	return &configRepository{db: db}
}

func (r *configRepository) FindAll(search string, typeFilter string, page, limit int) ([]models.SystemConfig, int64, error) {
	var configs []models.SystemConfig
	var total int64
	query := r.db.Model(&models.SystemConfig{})

	if search != "" {
		query = query.Where("config_key LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if typeFilter != "" {
		query = query.Where("data_type = ?", typeFilter)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Offset(offset).Limit(limit).Order("created_at desc").Find(&configs).Error
	return configs, total, err
}

func (r *configRepository) FindByID(id int64) (*models.SystemConfig, error) {
	var config models.SystemConfig
	err := r.db.First(&config, id).Error
	return &config, err
}

func (r *configRepository) FindByKey(key string) (*models.SystemConfig, error) {
	var config models.SystemConfig
	err := r.db.Where("config_key = ?", key).First(&config).Error
	return &config, err
}

func (r *configRepository) Create(config *models.SystemConfig) error {
	return r.db.Create(config).Error
}

func (r *configRepository) Update(config *models.SystemConfig) error {
	return r.db.Save(config).Error
}

func (r *configRepository) Delete(id int64) error {
	return r.db.Delete(&models.SystemConfig{}, id).Error
}

func (r *configRepository) CreateHistory(history *models.SystemConfigHistory) error {
	return r.db.Create(history).Error
}

func (r *configRepository) GetHistory(configID int64) ([]models.SystemConfigHistory, error) {
	var histories []models.SystemConfigHistory
	err := r.db.Where("config_id = ?", configID).Order("changed_at desc").Find(&histories).Error
	return histories, err
}
