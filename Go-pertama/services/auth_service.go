package services

import (
	"database/sql"
	"errors"
	"fmt"
	"go-pertama/config"
	"go-pertama/models"
	"go-pertama/repository"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(req models.LoginRequest) (*models.LoginResponse, error)
	Logout(email string) error
	ChangePassword(email string, req models.ChangePasswordRequest) error
}

type authService struct {
	userRepo repository.UserRepository
	config   *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
	return &authService{
		userRepo: userRepo,
		config:   cfg,
	}
}

func (s *authService) Login(req models.LoginRequest) (*models.LoginResponse, error) {
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid credentials")
		}
		return nil, errors.New("database connection error")
	}

	if !user.IsActive {
		return nil, errors.New("account is inactive")
	}

	passwordMatch := false
	isPlainText := false

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err == nil {
		passwordMatch = true
	} else {
		// Fallback: Check if it's a legacy plain text password
		if user.Password == req.Password {
			passwordMatch = true
			isPlainText = true
		}
	}

	if passwordMatch {
		// Reset failed attempts and update LastLogin
		s.userRepo.UpdateLastLogin(user.ID)

		// If it was plain text, migrate to bcrypt hash automatically
		if isPlainText {
			hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			s.userRepo.UpdatePassword(user.ID, string(hashed))
		}

		// Generate Token
		token := fmt.Sprintf("sql-jwt-token-%s-secret-%s", req.Email, strings.Split(s.config.JWT.Secret, "-")[0])

		s.userRepo.LogActivity(req.Email, "LOGIN", "User logged in")

		return &models.LoginResponse{
			Message: "Login successful",
			Token:   token,
			Success: true,
			User:    user,
		}, nil
	} else {
		// Increment failed attempts
		newAttempts := user.FailedLoginAttempts + 1
		s.userRepo.UpdateFailedAttempts(user.ID, newAttempts)

		s.userRepo.LogActivity(req.Email, "LOGIN_FAILED", fmt.Sprintf("Wrong password. Attempt: %d", newAttempts))
		return nil, errors.New("invalid credentials")
	}
}

func (s *authService) Logout(email string) error {
	err := s.userRepo.UpdateLastLogout(email)
	if err == nil {
		s.userRepo.LogActivity(email, "LOGOUT", "User logged out")
	}
	return err
}

func (s *authService) ChangePassword(email string, req models.ChangePasswordRequest) error {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify old password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword))
	if err != nil {
		// Try plain text
		if user.Password != req.OldPassword {
			return errors.New("incorrect old password")
		}
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = s.userRepo.UpdatePasswordByEmail(email, string(hashedPassword))
	if err == nil {
		s.userRepo.LogActivity(email, "CHANGE_PASSWORD", "Password changed successfully")
	}
	return err
}
