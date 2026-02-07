package middleware

import (
	"database/sql"
	"net/http"
	"strings"
)

func AuthMiddleware(db *sql.DB) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if !strings.HasPrefix(tokenString, "sql-jwt-token-") {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			// Robust token parsing
			// Token format: sql-jwt-token-{email}-secret-{secretPart}
			// We need to extract the email, which might contain hyphens.
			
			// 1. Remove prefix
			payload := strings.TrimPrefix(tokenString, "sql-jwt-token-")
			
			// 2. Find suffix "-secret-"
			// Use LastIndex to be safe if email contains "-secret-" (unlikely but possible)
			// or just Index if we assume email doesn't contain it.
			// Since secret part is at the end, LastIndex is safer for the suffix separator.
			suffixIdx := strings.LastIndex(payload, "-secret-")
			
			if suffixIdx == -1 {
				http.Error(w, "Invalid token format", http.StatusUnauthorized)
				return
			}
			
			email := payload[:suffixIdx]

			/*
			parts := strings.Split(tokenString, "-")
			if len(parts) < 5 {
				http.Error(w, "Invalid token format", http.StatusUnauthorized)
				return
			}
			email := parts[3]
			*/

			// Check if user is logged in (Kicked status check)
			var isLoggedIn bool
			var name string
			err := db.QueryRow("SELECT IsLoggedIn, Name FROM Users WHERE Email = @p1", email).Scan(&isLoggedIn, &name)
			if err != nil {
				// fmt.Printf("AuthMiddleware DB Error for %s: %v\n", email, err)
				http.Error(w, "User not found or database error", http.StatusUnauthorized)
				return
			}
			if !isLoggedIn {
				// fmt.Printf("AuthMiddleware: User %s is not logged in\n", email)
				http.Error(w, "Session expired or user kicked", http.StatusUnauthorized)
				return
			}

			r.Header.Set("X-User-Email", email)
			r.Header.Set("X-User-Name", name)
			next(w, r)
		}
	}
}

func EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With, Cache-Control")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
