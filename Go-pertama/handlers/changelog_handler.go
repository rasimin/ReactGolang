package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

type Commit struct {
	Hash    string `json:"hash"`
	Author  string `json:"author"`
	Date    string `json:"date"`
	Message string `json:"message"`
}

type ChangeLogHandler struct{}

func NewChangeLogHandler() *ChangeLogHandler {
	return &ChangeLogHandler{}
}

func (h *ChangeLogHandler) GetChangeLog(w http.ResponseWriter, r *http.Request) {
	// Execute git log command
	// Format: Hash|Author|Date|Message
	cmd := exec.Command("git", "log", "--pretty=format:%H|%an|%ad|%s", "--date=iso")
	output, err := cmd.Output()
	if err != nil {
		log.Printf("Error executing git log: %v", err)
		http.Error(w, "Failed to fetch git log", http.StatusInternalServerError)
		return
	}

	lines := strings.Split(string(output), "\n")
	var commits []Commit

	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "|", 4)
		if len(parts) == 4 {
			commits = append(commits, Commit{
				Hash:    parts[0],
				Author:  parts[1],
				Date:    parts[2],
				Message: parts[3],
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(commits)
}
