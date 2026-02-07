package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"go-pertama/models"
	"time"
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

func (s *userService) ExportActivityLogs(search string, userID int, startDate, endDate string) ([]byte, error) {
	// Limit 0 means fetch all
	logs, _, err := s.repo.GetAllActivityLogs(0, 0, search, userID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	b := &bytes.Buffer{}
	w := csv.NewWriter(b)

	// Header
	if err := w.Write([]string{"ID", "User", "Email", "Action", "Details", "Time"}); err != nil {
		return nil, err
	}

	// Data
	for _, log := range logs {
		record := []string{
			fmt.Sprintf("%d", log.ID),
			log.UserName,
			log.UserEmail,
			log.Action,
			log.Details,
			log.CreatedAt.Format(time.RFC3339),
		}
		if err := w.Write(record); err != nil {
			return nil, err
		}
	}

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, err
	}

	return b.Bytes(), nil
}
