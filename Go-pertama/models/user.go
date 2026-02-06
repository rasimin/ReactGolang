package models

import (
	"database/sql"
	"time"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	Success bool   `json:"success"`
	User    *User  `json:"user,omitempty"`
}

type User struct {
	ID                  int        `json:"id"`
	Email               string     `json:"email"`
	Name                string     `json:"name"`
	Role                string     `json:"role"` // This will now come from joined table
	RoleID              int        `json:"roleId"`
	RoleDetails         *Role      `json:"roleDetails,omitempty"`
	IsActive            bool       `json:"isActive"`
	ProfilePicture      string     `json:"profilePicture"`
	Avatar              []byte     `json:"-"`          // Binary data for avatar
	AvatarType          string     `json:"avatarType"` // MIME type (e.g., image/png)
	LastLogin           *time.Time `json:"lastLogin"`
	LastLogout          *time.Time `json:"lastLogout"`
	FailedLoginAttempts int        `json:"failedLoginAttempts"`
	IsLoggedIn          bool       `json:"isLoggedIn"`
	Password            string     `json:"-"` // Internal use, don't expose in JSON
}

type UsersResponse struct {
	Data  []User `json:"data"`
	Total int    `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}

type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	RoleID   int    `json:"roleId"`
	IsActive bool   `json:"isActive"`
}

type UpdateUserRequest struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	RoleID   int    `json:"roleId"`
	IsActive bool   `json:"isActive"`
	Password string `json:"password,omitempty"` // Optional for update
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

// ActivityLog model (implicit in main.go, making explicit here)
type ActivityLog struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	UserName  string    `json:"userName,omitempty"`
	UserEmail string    `json:"userEmail,omitempty"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	CreatedAt time.Time `json:"createdAt"`
}

// Helper structs for SQL scanning if needed
type UserScan struct {
	ID                  int
	Email               string
	Name                string
	Role                string
	IsActive            bool
	ProfilePicture      sql.NullString
	LastLogin           sql.NullTime
	LastLogout          sql.NullTime
	FailedLoginAttempts int
	Password            string
}
