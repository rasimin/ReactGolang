package services

import (
	"errors"
	"fmt"
	"go-pertama/models"
	"go-pertama/repository"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetAll(page, limit int, search string, roleID int) (*models.UsersResponse, error)
	Create(req models.CreateUserRequest, creatorEmail string) error
	Update(req models.UpdateUserRequest, updaterEmail string) error
	Delete(id int, deleterEmail string) error
	UploadProfilePicture(email string, file multipart.File, header *multipart.FileHeader) (string, error)
	GetProfile(email string) (*models.User, error)
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
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

func (s *userService) UploadProfilePicture(email string, file multipart.File, header *multipart.FileHeader) (string, error) {
	// Create unique filename
	filename := fmt.Sprintf("%d-%s", time.Now().Unix(), header.Filename)
	filename = strings.ReplaceAll(filename, " ", "_")

	// Ensure absolute path
	cwd, _ := os.Getwd()
	uploadDir := filepath.Join(cwd, "uploads")
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	uploadPath := filepath.Join(uploadDir, filename)

	// Create destination file
	dst, err := os.Create(uploadPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	// Copy content
	if _, err := io.Copy(dst, file); err != nil {
		return "", err
	}

	// Update DB
	err = s.repo.UpdateProfilePicture(email, filename)
	if err == nil {
		s.repo.LogActivity(email, "UPLOAD_PICTURE", "Uploaded "+filename)
	}

	return filename, err
}
