package services

import (
	"encoding/json"
	"errors"
	"go-pertama/models"
	"go-pertama/repository"
	"strconv"
	"time"
)

type ConfigService interface {
	GetAllConfigs(search, typeFilter string, page, limit int) ([]models.SystemConfig, int64, error)
	GetConfigByID(id int64) (*models.SystemConfig, error)
	CreateConfig(config *models.SystemConfig, createdBy string) error
	UpdateConfig(id int64, updateData *models.SystemConfig, updatedBy string, ip string, changeReason string) error
	DeleteConfig(id int64) error
	GetConfigHistory(id int64) ([]models.SystemConfigHistory, error)
}

type configService struct {
	repo repository.ConfigRepository
}

func NewConfigService(repo repository.ConfigRepository) ConfigService {
	return &configService{repo: repo}
}

func (s *configService) GetAllConfigs(search, typeFilter string, page, limit int) ([]models.SystemConfig, int64, error) {
	return s.repo.FindAll(search, typeFilter, page, limit)
}

func (s *configService) GetConfigByID(id int64) (*models.SystemConfig, error) {
	return s.repo.FindByID(id)
}

func (s *configService) CreateConfig(config *models.SystemConfig, createdBy string) error {
	// Validate Data Type
	if err := validateValue(config.MainValue, config.DataType); err != nil {
		return err
	}

	// Check Uniqueness
	existing, _ := s.repo.FindByKey(config.ConfigKey)
	if existing != nil && existing.ID != 0 {
		return errors.New("config key already exists")
	}

	config.CreatedBy = createdBy
	config.CreatedAt = time.Now()
	config.IsActive = true // Default

	return s.repo.Create(config)
}

func (s *configService) UpdateConfig(id int64, updateData *models.SystemConfig, updatedBy string, ip string, changeReason string) error {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	// Validate New Value
	if err := validateValue(updateData.MainValue, existing.DataType); err != nil {
		return err
	}

	// Record History
	history := &models.SystemConfigHistory{
		ConfigID:     existing.ID,
		OldValue:     existing.MainValue,
		NewValue:     updateData.MainValue,
		ChangeReason: changeReason,
		ChangedAt:    time.Now(),
		ChangedBy:    updatedBy,
		IPAddress:    ip,
	}

	// Update Fields
	existing.MainValue = updateData.MainValue
	existing.AlternativeValue = updateData.AlternativeValue
	existing.Description = updateData.Description
	existing.IsActive = updateData.IsActive
	existing.UpdatedBy = updatedBy
	existing.UpdatedAt = time.Now()

	if err := s.repo.CreateHistory(history); err != nil {
		return err
	}

	return s.repo.Update(existing)
}

func (s *configService) DeleteConfig(id int64) error {
	return s.repo.Delete(id)
}

func (s *configService) GetConfigHistory(id int64) ([]models.SystemConfigHistory, error) {
	return s.repo.GetHistory(id)
}

func validateValue(value string, dataType models.DataType) error {
	switch dataType {
	case models.TypeInteger:
		if _, err := strconv.Atoi(value); err != nil {
			return errors.New("invalid integer value")
		}
	case models.TypeBoolean:
		if value != "true" && value != "false" {
			return errors.New("value must be 'true' or 'false'")
		}
	case models.TypeFloat:
		if _, err := strconv.ParseFloat(value, 64); err != nil {
			return errors.New("invalid float value")
		}
	case models.TypeJSON:
		var js map[string]interface{}
		if json.Unmarshal([]byte(value), &js) != nil {
			// Try array
			var jsArr []interface{}
			if json.Unmarshal([]byte(value), &jsArr) != nil {
				return errors.New("invalid JSON format")
			}
		}
	}
	return nil
}
