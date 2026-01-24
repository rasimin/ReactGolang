package middleware

import (
	"net/http"
	"strings"
)

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
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
