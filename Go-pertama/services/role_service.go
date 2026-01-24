package services

import (
	"go-pertama/models"
	"go-pertama/repository"
	"time"
)

type RoleService interface {
	GetAllRoles(page, limit int, search string) (*models.RolesResponse, error)
	GetRoleByID(id int) (*models.Role, error)
	CreateRole(role *models.Role, createdBy string) error
	UpdateRole(role *models.Role, updatedBy string) error
	DeleteRole(id int) error
}

type roleService struct {
	repo repository.RoleRepository
}

func NewRoleService(repo repository.RoleRepository) RoleService {
	return &roleService{repo: repo}
}

func (s *roleService) GetAllRoles(page, limit int, search string) (*models.RolesResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 5
	}

	roles, total, err := s.repo.FindAll(page, limit, search)
	if err != nil {
		return nil, err
	}

	return &models.RolesResponse{
		Data:  roles,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *roleService) GetRoleByID(id int) (*models.Role, error) {
	return s.repo.FindByID(id)
}

func (s *roleService) CreateRole(role *models.Role, createdBy string) error {
	role.CreatedBy = createdBy
	role.UpdatedBy = createdBy
	role.CreatedAt = time.Now()
	role.UpdatedAt = time.Now()
	return s.repo.Create(role)
}

func (s *roleService) UpdateRole(role *models.Role, updatedBy string) error {
	existingRole, err := s.repo.FindByID(role.ID)
	if err != nil {
		return err
	}

	existingRole.Name = role.Name
	existingRole.Description = role.Description
	existingRole.IsActive = role.IsActive
	existingRole.UpdatedBy = updatedBy
	existingRole.UpdatedAt = time.Now()

	return s.repo.Update(existingRole)
}

func (s *roleService) DeleteRole(id int) error {
	return s.repo.Delete(id)
}
