package handlers

import (
	"encoding/json"
	"fmt"
	"go-pertama/models"
	"go-pertama/services"
	"net/http"
)

type AuthHandler struct {
	authService services.AuthService
}

func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds models.LoginRequest
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	resp, err := h.authService.Login(creds)
	if err != nil {
		fmt.Printf("Login failed: %v\n", err)
		statusCode := http.StatusUnauthorized
		if err.Error() == "database connection error" {
			statusCode = http.StatusInternalServerError
		}

		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(models.LoginResponse{
			Message: err.Error(),
			Success: false,
		})
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.Header.Get("X-User-Email")
	h.authService.Logout(email)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.Header.Get("X-User-Email")

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := h.authService.ChangePassword(email, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "incorrect old password" || err.Error() == "user not found" {
			statusCode = http.StatusUnauthorized
		}
		http.Error(w, err.Error(), statusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}
