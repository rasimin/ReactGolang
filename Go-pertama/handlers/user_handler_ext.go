package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

func (h *UserHandler) GetActivityLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.Header.Get("X-User-Email")
	if email == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	offset := 0
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	logs, err := h.userService.GetActivityLogs(email, limit, offset)
	if err != nil {
		http.Error(w, "Error retrieving logs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": logs,
		"meta": map[string]int{
			"limit":  limit,
			"offset": offset,
		},
	})
}

func (h *UserHandler) GetSystemActivityLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Ideally should check for Admin role here, but AuthMiddleware usually handles basic auth.
	// Role check can be done here or in middleware.

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	search := r.URL.Query().Get("search")
	userIDStr := r.URL.Query().Get("userId")
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")

	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}

	limit := 10
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	userID := 0
	if u, err := strconv.Atoi(userIDStr); err == nil {
		userID = u
	}

	logs, total, err := h.userService.GetAllActivityLogs(page, limit, search, userID, startDate, endDate)
	if err != nil {
		http.Error(w, "Error fetching logs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *UserHandler) ExportActivityLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	search := r.URL.Query().Get("search")
	userIDStr := r.URL.Query().Get("userId")
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")

	userID := 0
	if userIDStr != "" {
		fmt.Sscanf(userIDStr, "%d", &userID)
	}

	csvData, err := h.userService.ExportActivityLogs(search, userID, startDate, endDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("activity_logs_%s.csv", time.Now().Format("20060102_150405"))

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Write(csvData)
}
