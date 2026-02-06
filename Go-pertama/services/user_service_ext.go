package services

import (
	"go-pertama/models"
)

func (s *userService) GetActivityLogs(email string, limit int, offset int) ([]models.ActivityLog, error) {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return nil, err
	}
	return s.repo.GetActivityLogs(user.ID, limit, offset)
}
