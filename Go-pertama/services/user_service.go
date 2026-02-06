package services

import (
	"errors"
	"fmt"
	"go-pertama/models"
	"go-pertama/repository"
	"io"
	"mime/multipart"

	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetAll(page, limit int, search string, roleID int) (*models.UsersResponse, error)
	Create(req models.CreateUserRequest, creatorEmail string) error
	Update(req models.UpdateUserRequest, updaterEmail string) error
	Delete(id int, deleterEmail string) error
	UploadProfilePicture(email string, file multipart.File, header *multipart.FileHeader) error
	GetAvatar(email string) ([]byte, string, error)
	GetAvatarByID(id int) ([]byte, string, error)
	RemoveAvatar(email string) error
	GetProfile(email string) (*models.User, error)
	ResetFailedAttempts(id int, updatedBy string) error
	GetActiveUsers() ([]models.User, error)
	KickUser(email string, kickedBy string) error
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) ResetFailedAttempts(id int, updatedBy string) error {
	err := s.repo.UpdateFailedAttempts(id, 0)
	if err == nil {
		s.repo.LogActivity(updatedBy, "RESET_FAILED_ATTEMPTS", fmt.Sprintf("Reset failed attempts for user ID %d", id))
	}
	return err
}

func (s *userService) GetActiveUsers() ([]models.User, error) {
	return s.repo.GetActiveUsers()
}

func (s *userService) KickUser(email string, kickedBy string) error {
	err := s.repo.UpdateLoginStatus(email, false)
	if err == nil {
		s.repo.LogActivity(kickedBy, "KICK_USER", "Forced logout for "+email)
	}
	return err
}

func (s *userService) GetProfile(email string) (*models.User, error) {
	return s.repo.GetByEmail(email)
}

func (s *userService) GetAll(page, limit int, search string, roleID int) (*models.UsersResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 5
	}

	users, total, err := s.repo.GetAll(page, limit, search, roleID)
	if err != nil {
		return nil, err
	}

	return &models.UsersResponse{
		Data:  users,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *userService) Create(req models.CreateUserRequest, creatorEmail string) error {
	exists, _ := s.repo.EmailExists(req.Email)
	if exists {
		return errors.New("email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Role:     req.Role,
		RoleID:   req.RoleID,
		IsActive: req.IsActive,
	}

	err = s.repo.Create(user)
	if err == nil {
		s.repo.LogActivity(creatorEmail, "CREATE_USER", "Created user "+req.Email)
	}
	return err
}

func (s *userService) Update(req models.UpdateUserRequest, updaterEmail string) error {
	user := &models.User{
		ID:       req.ID,
		Email:    req.Email,
		Name:     req.Name,
		Role:     req.Role,
		RoleID:   req.RoleID,
		IsActive: req.IsActive,
	}

	err := s.repo.Update(user)
	if err != nil {
		return err
	}

	if req.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		err = s.repo.UpdatePassword(req.ID, string(hashed))
		if err != nil {
			return err
		}
	}

	s.repo.LogActivity(updaterEmail, "UPDATE_USER", fmt.Sprintf("Updated user ID %d", req.ID))
	return nil
}

func (s *userService) Delete(id int, deleterEmail string) error {
	err := s.repo.Delete(id)
	if err == nil {
		s.repo.LogActivity(deleterEmail, "DELETE_USER", fmt.Sprintf("Deleted user ID %d", id))
	}
	return err
}

func (s *userService) UploadProfilePicture(email string, file multipart.File, header *multipart.FileHeader) error {
	// Read file content
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return err
	}

	// Determine content type
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Update DB
	err = s.repo.UpdateAvatar(email, fileBytes, contentType)
	if err == nil {
		s.repo.LogActivity(email, "UPLOAD_AVATAR", "Uploaded avatar ("+contentType+")")
	}

	return err
}

func (s *userService) GetAvatar(email string) ([]byte, string, error) {
	return s.repo.GetAvatar(email)
}

func (s *userService) GetAvatarByID(id int) ([]byte, string, error) {
	return s.repo.GetAvatarByID(id)
}

func (s *userService) RemoveAvatar(email string) error {
	return s.repo.RemoveAvatar(email)
}
