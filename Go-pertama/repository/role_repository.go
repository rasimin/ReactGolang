package repository

import (
	"go-pertama/models"

	"gorm.io/gorm"
)

type RoleRepository interface {
	FindAll(page, limit int, search string) ([]models.Role, int64, error)
	FindByID(id int) (*models.Role, error)
	Create(role *models.Role) error
	Update(role *models.Role) error
	Delete(id int) error
}

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) FindAll(page, limit int, search string) ([]models.Role, int64, error) {
	var roles []models.Role
	var total int64

	query := r.db.Model(&models.Role{})

	if search != "" {
		searchLike := "%" + search + "%"
		query = query.Where("name LIKE ? OR description LIKE ?", searchLike, searchLike)
	}

	err := query.Count(&total).Error
	if err != nil {
		return []models.Role{}, 0, err
	}

	offset := (page - 1) * limit

	// Select all role columns and count of users
	// Use Model to ensure correct table mapping and deleted_at check
	err = query.Select("roles.*, (SELECT COUNT(*) FROM Users WHERE Users.RoleID = roles.id) as user_count").
		Offset(offset).Limit(limit).
		Scan(&roles).Error

	if roles == nil {
		roles = []models.Role{}
	}
	return roles, total, err
}

func (r *roleRepository) FindByID(id int) (*models.Role, error) {
	var role models.Role
	err := r.db.First(&role, id).Error
	return &role, err
}

func (r *roleRepository) Create(role *models.Role) error {
	return r.db.Create(role).Error
}

func (r *roleRepository) Update(role *models.Role) error {
	return r.db.Save(role).Error
}

func (r *roleRepository) Delete(id int) error {
	return r.db.Delete(&models.Role{}, id).Error
}
