package repository

import (
	"database/sql"
	"fmt"
	"go-pertama/models"
)

type UserRepository interface {
	GetByEmail(email string) (*models.User, error)
	GetByID(id int) (*models.User, error)
	Create(user *models.User) error
	Update(user *models.User) error
	Delete(id int, deletedBy string) error
	GetAll(page, limit int, search string, roleID int) ([]models.User, int, error)
	UpdatePassword(id int, hashedPassword string) error
	UpdatePasswordByEmail(email string, hashedPassword string) error
	UpdateLastLogin(id int) error
	UpdateLastLogout(email string) error
	UpdateFailedAttempts(id int, attempts int) error
	UpdateProfilePicture(email string, filename string) error
	UpdateAvatar(email string, avatar []byte, avatarType string) error
	GetAvatar(email string) ([]byte, string, error)
	GetAvatarByID(id int) ([]byte, string, error)
	RemoveAvatar(email string) error
	EmailExists(email string) (bool, error)
	LogActivity(email, action, details string)
	GetActivityLogs(userID int, limit int, offset int) ([]models.ActivityLog, error)
	GetAllActivityLogs(limit, offset int, search string, userID int, startDate, endDate string) ([]models.ActivityLog, int, error)
	UpdateLoginStatus(email string, isLoggedIn bool) error
	GetActiveUsers() ([]models.User, error)
	GetUserHistory(userID int) ([]models.UserHistory, error)
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var u models.User
	var pp sql.NullString
	var avatarType sql.NullString
	var lastLogin, lastLogout sql.NullTime
	var roleID sql.NullInt64
	var createdBy, updatedBy sql.NullString

	query := `SELECT u.ID, u.Email, u.Password, u.Name, COALESCE(r.Name, u.Role), u.RoleID, u.IsActive, u.ProfilePicture, u.AvatarType, u.LastLogin, u.LastLogout, u.FailedLoginAttempts, u.IsLoggedIn, u.CreatedBy, u.UpdatedBy
			  FROM Users u 
			  LEFT JOIN Roles r ON u.RoleID = r.ID 
			  WHERE u.Email = @p1`
	err := r.db.QueryRow(query, email).Scan(
		&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &roleID, &u.IsActive, &pp, &avatarType, &lastLogin, &lastLogout, &u.FailedLoginAttempts, &u.IsLoggedIn, &createdBy, &updatedBy,
	)
	if err != nil {
		return nil, err
	}

	if roleID.Valid {
		u.RoleID = int(roleID.Int64)
	}
	if pp.Valid {
		u.ProfilePicture = pp.String
	}
	if avatarType.Valid {
		u.AvatarType = avatarType.String
	}
	if lastLogin.Valid {
		u.LastLogin = &lastLogin.Time
	}
	if lastLogout.Valid {
		u.LastLogout = &lastLogout.Time
	}
	if createdBy.Valid {
		u.CreatedBy = createdBy.String
	}
	if updatedBy.Valid {
		u.UpdatedBy = updatedBy.String
	}

	return &u, nil
}

func (r *userRepository) GetUserHistory(userID int) ([]models.UserHistory, error) {
	query := `SELECT ID, UserID, Email, Name, Role, RoleID, IsActive, Action, ChangedBy, ChangedAt FROM UserHistory WHERE UserID = @p1 ORDER BY ChangedAt DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.UserHistory
	for rows.Next() {
		var h models.UserHistory
		var roleID sql.NullInt64
		if err := rows.Scan(&h.ID, &h.UserID, &h.Email, &h.Name, &h.Role, &roleID, &h.IsActive, &h.Action, &h.ChangedBy, &h.ChangedAt); err != nil {
			return nil, err
		}
		if roleID.Valid {
			h.RoleID = int(roleID.Int64)
		}
		history = append(history, h)
	}
	return history, nil
}

func (r *userRepository) GetByID(id int) (*models.User, error) {
	var u models.User
	var pp sql.NullString
	var lastLogin, lastLogout sql.NullTime
	var roleID sql.NullInt64
	var createdBy, updatedBy sql.NullString

	query := `SELECT u.ID, u.Email, u.Password, u.Name, COALESCE(r.Name, u.Role), u.RoleID, u.IsActive, u.ProfilePicture, u.LastLogin, u.LastLogout, u.FailedLoginAttempts, u.IsLoggedIn, u.CreatedBy, u.UpdatedBy
			  FROM Users u 
			  LEFT JOIN Roles r ON u.RoleID = r.ID 
			  WHERE u.ID = @p1`
	err := r.db.QueryRow(query, id).Scan(
		&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &roleID, &u.IsActive, &pp, &lastLogin, &lastLogout, &u.FailedLoginAttempts, &u.IsLoggedIn, &createdBy, &updatedBy,
	)
	if err != nil {
		return nil, err
	}

	if roleID.Valid {
		u.RoleID = int(roleID.Int64)
	}
	if pp.Valid {
		u.ProfilePicture = pp.String
	}
	if lastLogin.Valid {
		u.LastLogin = &lastLogin.Time
	}
	if lastLogout.Valid {
		u.LastLogout = &lastLogout.Time
	}
	if createdBy.Valid {
		u.CreatedBy = createdBy.String
	}
	if updatedBy.Valid {
		u.UpdatedBy = updatedBy.String
	}

	return &u, nil
}

func (r *userRepository) Create(user *models.User) error {
	query := `INSERT INTO Users (Email, Password, Name, Role, RoleID, IsActive, CreatedAt, CreatedBy) 
		VALUES (@p1, @p2, @p3, @p4, @p5, @p6, GETDATE(), @p7)`
	var roleID interface{} = user.RoleID
	if user.RoleID == 0 {
		roleID = nil
	}
	_, err := r.db.Exec(query, user.Email, user.Password, user.Name, user.Role, roleID, user.IsActive, user.CreatedBy)
	return err
}

func (r *userRepository) Update(user *models.User) error {
	// 1. Get current state for history
	currentUser, err := r.GetByID(user.ID)
	if err == nil && currentUser != nil {
		// Insert into history
		histQuery := `INSERT INTO UserHistory (UserID, Email, Name, Role, RoleID, IsActive, Action, ChangedBy, ChangedAt)
					  VALUES (@p1, @p2, @p3, @p4, @p5, @p6, 'UPDATE', @p7, GETDATE())`
		var histRoleID interface{} = currentUser.RoleID
		if currentUser.RoleID == 0 {
			histRoleID = nil
		}
		r.db.Exec(histQuery, currentUser.ID, currentUser.Email, currentUser.Name, currentUser.Role, histRoleID, currentUser.IsActive, user.UpdatedBy)
	}

	// 2. Update user
	query := `UPDATE Users SET Name=@p1, Role=@p2, RoleID=@p3, IsActive=@p4, Email=@p5, UpdatedBy=@p6, UpdatedAt=GETDATE() WHERE ID=@p7`
	var roleID interface{} = user.RoleID
	if user.RoleID == 0 {
		roleID = nil
	}
	_, err = r.db.Exec(query, user.Name, user.Role, roleID, user.IsActive, user.Email, user.UpdatedBy, user.ID)
	return err
}

func (r *userRepository) Delete(id int, deletedBy string) error {
	// 1. Get current state for history
	currentUser, err := r.GetByID(id)
	if err == nil && currentUser != nil {
		// Insert into history
		histQuery := `INSERT INTO UserHistory (UserID, Email, Name, Role, RoleID, IsActive, Action, ChangedBy, ChangedAt)
					  VALUES (@p1, @p2, @p3, @p4, @p5, @p6, 'DELETE', @p7, GETDATE())`
		var histRoleID interface{} = currentUser.RoleID
		if currentUser.RoleID == 0 {
			histRoleID = nil
		}
		r.db.Exec(histQuery, currentUser.ID, currentUser.Email, currentUser.Name, currentUser.Role, histRoleID, currentUser.IsActive, deletedBy)
	}

	// 2. Delete user
	_, err = r.db.Exec("DELETE FROM Users WHERE ID = @p1", id)
	return err
}

func (r *userRepository) GetAll(page, limit int, search string, roleID int) ([]models.User, int, error) {
	offset := (page - 1) * limit
	whereClause := "WHERE 1=1"
	params := []interface{}{}

	if search != "" {
		whereClause += " AND (u.Name LIKE @p1 OR u.Email LIKE @p1)"
		params = append(params, "%"+search+"%")
	}

	if roleID > 0 {
		paramIdx := len(params) + 1
		whereClause += fmt.Sprintf(" AND u.RoleID = @p%d", paramIdx)
		params = append(params, roleID)
	}

	// Get Total Count
	var total int
	countQuery := "SELECT COUNT(*) FROM Users u " + whereClause
	err := r.db.QueryRow(countQuery, params...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get Data
	query := fmt.Sprintf(`SELECT u.ID, u.Email, u.Name, r.Name, u.RoleID, u.IsActive, u.ProfilePicture, u.LastLogin, u.LastLogout, u.FailedLoginAttempts, u.CreatedBy, u.UpdatedBy 
						  FROM Users u 
						  LEFT JOIN Roles r ON u.RoleID = r.ID 
						  %s ORDER BY u.ID DESC OFFSET %d ROWS FETCH NEXT %d ROWS ONLY`, whereClause, offset, limit)

	rows, err := r.db.Query(query, params...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		var pp sql.NullString
		var lastLogin, lastLogout sql.NullTime
		var roleID sql.NullInt64
		var createdBy, updatedBy sql.NullString

		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &roleID, &u.IsActive, &pp, &lastLogin, &lastLogout, &u.FailedLoginAttempts, &createdBy, &updatedBy); err != nil {
			continue
		}
		if roleID.Valid {
			u.RoleID = int(roleID.Int64)
		}
		if pp.Valid {
			u.ProfilePicture = pp.String
		}
		if lastLogin.Valid {
			u.LastLogin = &lastLogin.Time
		}
		if lastLogout.Valid {
			u.LastLogout = &lastLogout.Time
		}
		if createdBy.Valid {
			u.CreatedBy = createdBy.String
		}
		if updatedBy.Valid {
			u.UpdatedBy = updatedBy.String
		}
		users = append(users, u)
	}

	return users, total, nil
}

func (r *userRepository) UpdatePassword(id int, hashedPassword string) error {
	_, err := r.db.Exec("UPDATE Users SET Password = @p1 WHERE ID = @p2", hashedPassword, id)
	return err
}

func (r *userRepository) UpdatePasswordByEmail(email string, hashedPassword string) error {
	_, err := r.db.Exec("UPDATE Users SET Password = @p1 WHERE Email = @p2", hashedPassword, email)
	return err
}

func (r *userRepository) UpdateLastLogin(id int) error {
	_, err := r.db.Exec("UPDATE Users SET LastLogin = GETDATE() WHERE ID = @p1", id)
	return err
}

func (r *userRepository) UpdateLastLogout(email string) error {
	_, err := r.db.Exec("UPDATE Users SET LastLogout = GETDATE() WHERE Email = @p1", email)
	return err
}

func (r *userRepository) UpdateFailedAttempts(id int, attempts int) error {
	_, err := r.db.Exec("UPDATE Users SET FailedLoginAttempts = @p1 WHERE ID = @p2", attempts, id)
	return err
}

func (r *userRepository) UpdateProfilePicture(email string, filename string) error {
	_, err := r.db.Exec("UPDATE Users SET ProfilePicture = @p1 WHERE Email = @p2", filename, email)
	return err
}

func (r *userRepository) UpdateAvatar(email string, avatar []byte, avatarType string) error {
	_, err := r.db.Exec("UPDATE Users SET Avatar = @p1, AvatarType = @p2 WHERE Email = @p3", avatar, avatarType, email)
	return err
}

func (r *userRepository) GetAvatar(email string) ([]byte, string, error) {
	var avatar []byte
	var avatarType sql.NullString
	err := r.db.QueryRow("SELECT Avatar, AvatarType FROM Users WHERE Email = @p1", email).Scan(&avatar, &avatarType)
	if err != nil {
		return nil, "", err
	}
	return avatar, avatarType.String, nil
}

func (r *userRepository) GetAvatarByID(id int) ([]byte, string, error) {
	var avatar []byte
	var avatarType sql.NullString
	err := r.db.QueryRow("SELECT Avatar, AvatarType FROM Users WHERE ID = @p1", id).Scan(&avatar, &avatarType)
	if err != nil {
		return nil, "", err
	}
	return avatar, avatarType.String, nil
}

func (r *userRepository) RemoveAvatar(email string) error {
	_, err := r.db.Exec("UPDATE Users SET Avatar = NULL, AvatarType = NULL WHERE Email = @p1", email)
	return err
}

func (r *userRepository) EmailExists(email string) (bool, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM Users WHERE Email = @p1", email).Scan(&count)
	return count > 0, err
}

func (r *userRepository) LogActivity(email, action, details string) {
	// First get user ID from email
	var userID int
	err := r.db.QueryRow("SELECT ID FROM Users WHERE Email = @p1", email).Scan(&userID)
	if err != nil {
		// fmt.Printf("Error getting user ID for activity log: %v\n", err)
		return
	}

	_, err = r.db.Exec("INSERT INTO ActivityLogs (UserID, Action, Details) VALUES (@p1, @p2, @p3)", userID, action, details)
	if err != nil {
		// fmt.Printf("Error logging activity: %v\n", err)
	}
}

func (r *userRepository) UpdateLoginStatus(email string, isLoggedIn bool) error {
	_, err := r.db.Exec("UPDATE Users SET IsLoggedIn = @p1 WHERE Email = @p2", isLoggedIn, email)
	return err
}

func (r *userRepository) GetActiveUsers() ([]models.User, error) {
	query := `SELECT u.ID, u.Email, u.Name, COALESCE(r.Name, u.Role), u.RoleID, u.IsActive, u.ProfilePicture, u.LastLogin, u.LastLogout, u.FailedLoginAttempts, u.IsLoggedIn
			  FROM Users u 
			  LEFT JOIN Roles r ON u.RoleID = r.ID 
			  WHERE u.IsLoggedIn = 1`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		var pp sql.NullString
		var lastLogin, lastLogout sql.NullTime
		var roleID sql.NullInt64

		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &roleID, &u.IsActive, &pp, &lastLogin, &lastLogout, &u.FailedLoginAttempts, &u.IsLoggedIn); err != nil {
			continue
		}
		if roleID.Valid {
			u.RoleID = int(roleID.Int64)
		}
		if pp.Valid {
			u.ProfilePicture = pp.String
		}
		if lastLogin.Valid {
			u.LastLogin = &lastLogin.Time
		}
		if lastLogout.Valid {
			u.LastLogout = &lastLogout.Time
		}
		users = append(users, u)
	}

	return users, nil
}