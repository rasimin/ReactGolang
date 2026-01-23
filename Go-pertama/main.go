package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go-pertama/config"

	_ "github.com/microsoft/go-mssqldb"
)

// Global configuration
var appConfig *config.Config

// Global database connection pool
var db *sql.DB

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
	ID             int    `json:"id"`
	Email          string `json:"email"`
	ProfilePicture string `json:"profilePicture"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func initDB() {
	// Connection string (DSN format)
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;database=%s",
		appConfig.Database.Host,
		appConfig.Database.User,
		appConfig.Database.Password,
		appConfig.Database.DBName,
	)

	// Add port if specified
	if appConfig.Database.Port != "" {
		connString += fmt.Sprintf(";port=%s", appConfig.Database.Port)
	}

	var err error
	db, err = sql.Open("sqlserver", connString)
	if err != nil {
		log.Fatal("Error creating connection pool: ", err.Error())
	}

	// Verify connection
	err = db.Ping()
	if err != nil {
		fmt.Printf("Warning: Could not connect to SQL Server: %s\n", err.Error())
		fmt.Println("Please ensure SQL Server is running, TCP/IP is enabled, and the database exists.")
	} else {
		fmt.Println("Successfully connected to SQL Server!")
	}
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", appConfig.CORS.AllowedOrigins)
		w.Header().Set("Access-Control-Allow-Methods", appConfig.CORS.AllowedMethods)
		w.Header().Set("Access-Control-Allow-Headers", appConfig.CORS.AllowedHeaders)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Simple Auth Middleware
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		// Dummy token validation: sql-jwt-token-EMAIL-secret-...
		if !strings.HasPrefix(tokenString, "sql-jwt-token-") {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(tokenString, "-")
		if len(parts) < 5 {
			http.Error(w, "Invalid token format", http.StatusUnauthorized)
			return
		}

		email := parts[3] // Extract email from dummy token

		// Context could be used here to pass user info, but for now we rely on headers
		r.Header.Set("X-User-Email", email)

		next(w, r)
	}
}

func logActivity(email, action, details string) {
	var userID int
	err := db.QueryRow("SELECT ID FROM Users WHERE Email = @p1", email).Scan(&userID)
	if err != nil {
		log.Printf("Failed to get UserID for log: %v", err)
		return
	}

	_, err = db.Exec("INSERT INTO ActivityLogs (UserID, Action, Details, CreatedAt) VALUES (@p1, @p2, @p3, GETDATE())",
		userID, action, details)
	if err != nil {
		log.Printf("Failed to insert activity log: %v", err)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds LoginRequest
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Query database for user
	var storedPassword string
	var id int
	var profilePicture sql.NullString

	query := "SELECT ID, Password, ProfilePicture FROM Users WHERE Email = @p1"

	err = db.QueryRow(query, creds.Email).Scan(&id, &storedPassword, &profilePicture)

	if err != nil {
		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(LoginResponse{
				Message: "Invalid credentials (User not found)",
				Success: false,
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(LoginResponse{
			Message: "Database error: " + err.Error(),
			Success: false,
		})
		return
	}

	if storedPassword == creds.Password {
		// Login successful
		token := fmt.Sprintf("sql-jwt-token-%s-secret-%s", creds.Email, strings.Split(appConfig.JWT.Secret, "-")[0])

		pp := ""
		if profilePicture.Valid {
			pp = profilePicture.String
		}

		logActivity(creds.Email, "LOGIN", "User logged in")

		json.NewEncoder(w).Encode(LoginResponse{
			Message: "Login successful",
			Token:   token,
			Success: true,
			User: &User{
				ID:             id,
				Email:          creds.Email,
				ProfilePicture: pp,
			},
		})
	} else {
		logActivity(creds.Email, "LOGIN_FAILED", "Wrong password")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{
			Message: "Invalid credentials (Wrong password)",
			Success: false,
		})
	}
}

func changePasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.Header.Get("X-User-Email")

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify old password
	var currentPassword string
	err := db.QueryRow("SELECT Password FROM Users WHERE Email = @p1", email).Scan(&currentPassword)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if currentPassword != req.OldPassword {
		http.Error(w, "Incorrect old password", http.StatusUnauthorized)
		return
	}

	// Update password
	_, err = db.Exec("UPDATE Users SET Password = @p1, UpdatedAt = GETDATE() WHERE Email = @p2", req.NewPassword, email)
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	logActivity(email, "CHANGE_PASSWORD", "Password changed successfully")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (10 MB limit)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("profilePicture")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	email := r.Header.Get("X-User-Email")

	// Create unique filename
	filename := fmt.Sprintf("%d-%s", time.Now().Unix(), handler.Filename)

	// Sanitize filename
	filename = strings.ReplaceAll(filename, " ", "_")

	// Ensure absolute path
	cwd, _ := os.Getwd()
	uploadPath := filepath.Join(cwd, "uploads", filename)

	// Create destination file
	dst, err := os.Create(uploadPath)
	if err != nil {
		log.Printf("Error creating file at %s: %v", uploadPath, err)
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy content
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file content", http.StatusInternalServerError)
		return
	}

	// Update DB
	_, err = db.Exec("UPDATE Users SET ProfilePicture = @p1, UpdatedAt = GETDATE() WHERE Email = @p2", filename, email)
	if err != nil {
		http.Error(w, "Failed to update profile picture in DB", http.StatusInternalServerError)
		return
	}

	logActivity(email, "UPLOAD_PICTURE", "Uploaded "+filename)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "File uploaded successfully",
		"filename": filename,
	})
}

func main() {
	// Load Configuration
	var err error
	appConfig, err = config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Ensure uploads directory exists
	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		if err := os.Mkdir("uploads", 0755); err != nil {
			log.Printf("Warning: Failed to create uploads directory: %v", err)
		}
	}

	// Initialize Database
	initDB()
	defer db.Close()

	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("/login", enableCORS(loginHandler))

	// Static files (Uploads)
	// IMPORTANT: Ensure the URL prefix matches the path structure
	fileServer := http.FileServer(http.Dir("./uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		fileServer.ServeHTTP(w, r)
	})))

	// Protected routes
	mux.HandleFunc("/change-password", enableCORS(authMiddleware(changePasswordHandler)))
	mux.HandleFunc("/upload-picture", enableCORS(authMiddleware(uploadHandler)))

	// Frontend Static Files
	// Assumes react-pertama is at ../react-pertama
	frontendPath := "../react-pertama"
	fs := http.FileServer(http.Dir(frontendPath))

	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If route starts with /src/ or /assets/ or ends with .js/.css/.svg/.png, serve file directly
		if strings.HasPrefix(r.URL.Path, "/src/") ||
			strings.HasPrefix(r.URL.Path, "/assets/") ||
			strings.HasSuffix(r.URL.Path, ".js") ||
			strings.HasSuffix(r.URL.Path, ".jsx") ||
			strings.HasSuffix(r.URL.Path, ".css") ||
			strings.HasSuffix(r.URL.Path, ".svg") {
			fs.ServeHTTP(w, r)
			return
		}

		// Otherwise, serve index.html for SPA routing (except for specific API routes already matched)
		// Note: http.ServeMux matches longest pattern. /login etc are already matched.
		// Only unmatched routes come here (if mapped to /)

		path := filepath.Join(frontendPath, r.URL.Path)
		// Check if file exists (e.g. vite.svg at root)
		info, err := os.Stat(path)
		if err == nil && !info.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html
		http.ServeFile(w, r, filepath.Join(frontendPath, "index.html"))
	}))

	port := appConfig.App.Port
	fmt.Printf("Server starting on port %s in %s mode...\n", port, appConfig.App.Env)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		fmt.Printf("Error starting server: %s\n", err)
	}
}
