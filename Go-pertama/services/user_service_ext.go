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

func (s *userService) GetAllActivityLogs(page, limit int, search string, userID int, startDate, endDate string) ([]models.ActivityLog, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit
	return s.repo.GetAllActivityLogs(limit, offset, search, userID, startDate, endDate)
}
