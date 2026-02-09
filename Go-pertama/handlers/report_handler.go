package handlers

import (
	"encoding/json"
	"fmt"
	"go-pertama/services"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

type ReportHandler struct {
	userService services.UserService
}

func NewReportHandler(userService services.UserService) *ReportHandler {
	return &ReportHandler{userService: userService}
}

type SummaryRow struct {
	FinishDate  string  `json:"finishDate"`
	TotalWeight float64 `json:"totalWeight"`
}

type DetailRow struct {
	FinishDate string  `json:"finishDate"`
	Weight     float64 `json:"weight"`
	TaskName   string  `json:"taskName"`
	SheetName  string  `json:"sheetName"`
}

type ReportResponse struct {
	Summary []SummaryRow `json:"summary"`
	Detail  []DetailRow  `json:"detail"`
}

// Helper struct for internal processing
type rawRow struct {
	FinishDate string
	Weight     float64
	TaskName   string
	SheetName  string
}

func (h *ReportHandler) UploadSummary(w http.ResponseWriter, r *http.Request) {
	// 1. Parse Multipart Form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB limit
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// 2. Open Excel File
	f, err := excelize.OpenReader(file)
	if err != nil {
		http.Error(w, "Unable to open excel file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer f.Close()

	// 3. Read Rows from First Sheet
	sheetList := f.GetSheetList()
	if len(sheetList) == 0 {
		http.Error(w, "No sheets found in excel file", http.StatusBadRequest)
		return
	}
	firstSheet := sheetList[0]

	rows, err := f.GetRows(firstSheet)
	if err != nil {
		http.Error(w, "Error reading rows: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if len(rows) < 2 {
		http.Error(w, "File is empty or missing headers", http.StatusBadRequest)
		return
	}

	// 4. Map Headers
	headers := rows[0]
	colIndex := make(map[string]int)
	for i, h := range headers {
		colIndex[strings.TrimSpace(h)] = i
	}

	requiredCols := []string{"Finish Date", "Weight", "Task Name", "Sheet Name"}
	for _, col := range requiredCols {
		if _, ok := colIndex[col]; !ok {
			http.Error(w, fmt.Sprintf("Missing required column: %s", col), http.StatusBadRequest)
			return
		}
	}

	// 5. Process Data
	var rawData []rawRow
	dateGroups := make(map[string]float64)
	dateTasks := make(map[string][]rawRow)

	for i := 1; i < len(rows); i++ {
		row := rows[i]

		// Helper to get cell value safely
		getCell := func(colName string) string {
			idx := colIndex[colName]
			if idx < len(row) {
				return row[idx]
			}
			return ""
		}

		finishDateRaw := getCell("Finish Date")
		weightRaw := getCell("Weight")
		taskName := getCell("Task Name")
		sheetName := getCell("Sheet Name")

		// Parse Date
		// Try to handle Excel date format (often coming as MM-DD-YY or similar string, or serial)
		// For simplicity, we'll try to parse common formats or use the string as is if it looks like a date.
		// A robust way would be checking if it's a serial number first.

		parsedDateStr := parseDate(finishDateRaw)

		// Parse Weight
		weight, _ := strconv.ParseFloat(weightRaw, 64)

		rr := rawRow{
			FinishDate: parsedDateStr,
			Weight:     weight,
			TaskName:   taskName,
			SheetName:  sheetName,
		}

		rawData = append(rawData, rr)

		// Aggregate
		dateGroups[parsedDateStr] += weight
		dateTasks[parsedDateStr] = append(dateTasks[parsedDateStr], rr)
	}

	// 6. Build Response
	var summary []SummaryRow
	var detail []DetailRow

	// Sort dates
	var sortedDates []string
	for k := range dateGroups {
		sortedDates = append(sortedDates, k)
	}
	sort.Strings(sortedDates)

	for _, date := range sortedDates {
		totalWeight := dateGroups[date]

		// Add to Summary
		summary = append(summary, SummaryRow{
			FinishDate:  date,
			TotalWeight: totalWeight,
		})

		// Add to Detail: First the Total row
		detail = append(detail, DetailRow{
			FinishDate: date,
			Weight:     totalWeight,
			TaskName:   "Total",
			SheetName:  "",
		})

		// Add individual tasks
		tasks := dateTasks[date]
		for _, t := range tasks {
			detail = append(detail, DetailRow{
				FinishDate: t.FinishDate,
				Weight:     t.Weight,
				TaskName:   t.TaskName,
				SheetName:  t.SheetName,
			})
		}
	}

	response := ReportResponse{
		Summary: summary,
		Detail:  detail,
	}

	// Log Activity
	email := r.Header.Get("X-User-Email")
	if email != "" {
		h.userService.LogActivity(email, "UPLOAD_SUMMARY_REPORT", fmt.Sprintf("Uploaded summary report: %s", header.Filename))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// parseDate attempts to normalize the date string
// Excelize GetRows returns the string value displayed in the cell.
// If it's a date like 10/25/2023, we want 2023-10-25.
func parseDate(dateStr string) string {
	if dateStr == "" {
		return ""
	}

	// Check if it's a serial number (numeric)
	if f, err := strconv.ParseFloat(dateStr, 64); err == nil {
		// Convert Excel serial date to time
		// Excel base date is usually Dec 30, 1899
		baseDate := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
		days := int(f)
		t := baseDate.AddDate(0, 0, days)
		return t.Format("2006-01-02")
	}

	// Try common layouts
	layouts := []string{
		"01-02-06",   // MM-DD-YY
		"2006-01-02", // YYYY-MM-DD
		"01/02/2006", // MM/DD/YYYY
		"1/2/06",     // M/D/YY
		"02-Jan-06",  // DD-Mon-YY
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, dateStr); err == nil {
			return t.Format("2006-01-02")
		}
	}

	// If parse fails, return original (or handle error)
	return dateStr
}
