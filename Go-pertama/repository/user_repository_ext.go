package repository

import (
	"database/sql"
	"fmt"
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

func (r *userRepository) GetAllActivityLogs(limit, offset int, search string, userID int, startDate, endDate string) ([]models.ActivityLog, int, error) {
	whereClause := "WHERE 1=1"
	params := []interface{}{}

	if search != "" {
		// Parameter numbering in SQL Server depends on driver but usually positional @p1, @p2...
		// To be safe with potentially multiple uses of same param:
		p1 := len(params) + 1
		p2 := len(params) + 2
		p3 := len(params) + 3
		p4 := len(params) + 4
		whereClause += fmt.Sprintf(" AND (a.Action LIKE @p%d OR a.Details LIKE @p%d OR u.Email LIKE @p%d OR u.Name LIKE @p%d)", p1, p2, p3, p4)
		searchTerm := "%" + search + "%"
		params = append(params, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if userID > 0 {
		paramIdx := len(params) + 1
		whereClause += fmt.Sprintf(" AND a.UserID = @p%d", paramIdx)
		params = append(params, userID)
	}

	if startDate != "" {
		paramIdx := len(params) + 1
		whereClause += fmt.Sprintf(" AND a.CreatedAt >= @p%d", paramIdx)
		params = append(params, startDate+" 00:00:00")
	}

	if endDate != "" {
		paramIdx := len(params) + 1
		whereClause += fmt.Sprintf(" AND a.CreatedAt <= @p%d", paramIdx)
		params = append(params, endDate+" 23:59:59")
	}

	// Count
	var total int
	countQuery := "SELECT COUNT(*) FROM ActivityLogs a LEFT JOIN Users u ON a.UserID = u.ID " + whereClause
	err := r.db.QueryRow(countQuery, params...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Fetch
	pOffset := len(params) + 1
	pLimit := len(params) + 2

	paginationClause := ""
	if limit > 0 {
		paginationClause = fmt.Sprintf("OFFSET @p%d ROWS FETCH NEXT @p%d ROWS ONLY", pOffset, pLimit)
		params = append(params, offset, limit)
	}

	query := fmt.Sprintf(`
		SELECT a.ID, a.UserID, u.Name, u.Email, a.Action, a.Details, a.CreatedAt
		FROM ActivityLogs a
		LEFT JOIN Users u ON a.UserID = u.ID
		%s
		ORDER BY a.CreatedAt DESC
		%s
	`, whereClause, paginationClause)

	rows, err := r.db.Query(query, params...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.ActivityLog
	for rows.Next() {
		var log models.ActivityLog
		var userName, userEmail sql.NullString
		if err := rows.Scan(&log.ID, &log.UserID, &userName, &userEmail, &log.Action, &log.Details, &log.CreatedAt); err != nil {
			return nil, 0, err
		}
		log.UserName = userName.String
		log.UserEmail = userEmail.String
		logs = append(logs, log)
	}

	return logs, total, nil
}
