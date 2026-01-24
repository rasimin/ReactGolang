package repository

import (
	"database/sql"
	"fmt"
	"go-pertama/models"
	"log"
)

type UserRepository interface {
	GetByEmail(email string) (*models.User, error)
	GetByID(id int) (*models.User, error)
	Create(user *models.User) error
	Update(user *models.User) error
	Delete(id int) error
	GetAll(page, limit int, search string) ([]models.User, int, error)
	UpdatePassword(id int, hashedPassword string) error
	UpdatePasswordByEmail(email string, hashedPassword string) error
	UpdateLastLogin(id int) error
	UpdateLastLogout(email string) error
	UpdateFailedAttempts(id int, attempts int) error
	UpdateProfilePicture(email string, filename string) error
	EmailExists(email string) (bool, error)
	LogActivity(email, action, details string)
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
	var lastLogin, lastLogout sql.NullTime

	query := "SELECT ID, Email, Password, Name, Role, IsActive, ProfilePicture, LastLogin, LastLogout, FailedLoginAttempts FROM Users WHERE Email = @p1"
	err := r.db.QueryRow(query, email).Scan(
		&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.IsActive, &pp, &lastLogin, &lastLogout, &u.FailedLoginAttempts,
	)
	if err != nil {
		return nil, err
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

	return &u, nil
}

func (r *userRepository) GetByID(id int) (*models.User, error) {
	var u models.User
	var pp sql.NullString
	var lastLogin, lastLogout sql.NullTime

	query := "SELECT ID, Email, Password, Name, Role, IsActive, ProfilePicture, LastLogin, LastLogout, FailedLoginAttempts FROM Users WHERE ID = @p1"
	err := r.db.QueryRow(query, id).Scan(
		&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.IsActive, &pp, &lastLogin, &lastLogout, &u.FailedLoginAttempts,
	)
	if err != nil {
		return nil, err
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

	return &u, nil
}

func (r *userRepository) Create(user *models.User) error {
	query := `INSERT INTO Users (Email, Password, Name, Role, IsActive, CreatedAt) 
		VALUES (@p1, @p2, @p3, @p4, @p5, GETDATE())`
	_, err := r.db.Exec(query, user.Email, user.Password, user.Name, user.Role, user.IsActive)
	return err
}

func (r *userRepository) Update(user *models.User) error {
	query := `UPDATE Users SET Name=@p1, Role=@p2, IsActive=@p3, Email=@p4, UpdatedAt=GETDATE() WHERE ID=@p5`
	_, err := r.db.Exec(query, user.Name, user.Role, user.IsActive, user.Email, user.ID)
	return err
}

func (r *userRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM Users WHERE ID = @p1", id)
	return err
}

func (r *userRepository) GetAll(page, limit int, search string) ([]models.User, int, error) {
	offset := (page - 1) * limit
	whereClause := ""
	params := []interface{}{}

	if search != "" {
		whereClause = "WHERE Name LIKE @p1 OR Email LIKE @p1"
		params = append(params, "%"+search+"%")
	}

	// Get Total Count
	var total int
	countQuery := "SELECT COUNT(*) FROM Users " + whereClause
	err := r.db.QueryRow(countQuery, params...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get Data
	query := fmt.Sprintf("SELECT ID, Email, Name, Role, IsActive, ProfilePicture, LastLogin, LastLogout, FailedLoginAttempts FROM Users %s ORDER BY ID DESC OFFSET %d ROWS FETCH NEXT %d ROWS ONLY", whereClause, offset, limit)
	
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

		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &pp, &lastLogin, &lastLogout, &u.FailedLoginAttempts); err != nil {
			continue
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
	
	if users == nil {
		users = []models.User{}
	}

	return users, total, nil
}

func (r *userRepository) UpdatePassword(id int, hashedPassword string) error {
	_, err := r.db.Exec("UPDATE Users SET Password = @p1 WHERE ID = @p2", hashedPassword, id)
	return err
}

func (r *userRepository) UpdatePasswordByEmail(email string, hashedPassword string) error {
	_, err := r.db.Exec("UPDATE Users SET Password = @p1, UpdatedAt = GETDATE() WHERE Email = @p2", hashedPassword, email)
	return err
}

func (r *userRepository) UpdateLastLogin(id int) error {
	_, err := r.db.Exec("UPDATE Users SET FailedLoginAttempts = 0, LastLogin = GETDATE() WHERE ID = @p1", id)
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
	_, err := r.db.Exec("UPDATE Users SET ProfilePicture = @p1, UpdatedAt = GETDATE() WHERE Email = @p2", filename, email)
	return err
}

func (r *userRepository) EmailExists(email string) (bool, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM Users WHERE Email = @p1", email).Scan(&count)
	return count > 0, err
}

func (r *userRepository) LogActivity(email, action, details string) {
	var userID int
	err := r.db.QueryRow("SELECT ID FROM Users WHERE Email = @p1", email).Scan(&userID)
	if err != nil {
		log.Printf("Failed to get UserID for log: %v", err)
		return
	}

	_, err = r.db.Exec("INSERT INTO ActivityLogs (UserID, Action, Details, CreatedAt) VALUES (@p1, @p2, @p3, GETDATE())",
		userID, action, details)
	if err != nil {
		log.Printf("Failed to insert activity log: %v", err)
	}
}
