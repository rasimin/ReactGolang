package repository

import (
	"go-pertama/models"
)

func (r *userRepository) GetActivityLogs(userID int, limit int, offset int) ([]models.ActivityLog, error) {
	query := `
		SELECT ID, UserID, Action, Details, CreatedAt
		FROM ActivityLogs
		WHERE UserID = @p1
		ORDER BY CreatedAt DESC, ID DESC
		OFFSET @p2 ROWS FETCH NEXT @p3 ROWS ONLY
	`
	rows, err := r.db.Query(query, userID, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.ActivityLog
	for rows.Next() {
		var log models.ActivityLog
		if err := rows.Scan(&log.ID, &log.UserID, &log.Action, &log.Details, &log.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}
