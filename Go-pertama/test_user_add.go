package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
)

func main() {
	baseURL := "http://localhost:8080"

	log.Println("1. Logging in...")

	loginPayload := map[string]string{
		"email":    "admin@example.com",
		"password": "password123",
	}
	loginBody, _ := json.Marshal(loginPayload)

	log.Println("Sending request...")
	resp, err := http.Post(baseURL+"/login", "application/json", bytes.NewBuffer(loginBody))
	if err != nil {
		log.Printf("Login failed: %v\n", err)
		return
	}
	defer resp.Body.Close()
	log.Println("Request sent.")

	body, _ := ioutil.ReadAll(resp.Body)
	log.Printf("Login Response Status: %s\n", resp.Status)
	log.Printf("Login Response Body: %s\n", string(body))

	var token string
	if resp.StatusCode == 200 {
		var loginResp map[string]interface{}
		json.Unmarshal(body, &loginResp)
		if t, ok := loginResp["token"].(string); ok {
			token = t
			log.Println("Token obtained.")
		}
	} else {
		log.Println("Login failed, skipping add user.")
		return
	}

	log.Println("\n2. Adding User...")
	userPayload := map[string]interface{}{
		"email":    "testuser_reset@example.com",
		"name":     "Test User Reset",
		"password": "password123",
		"roleId":   2,
	}
	userBody, _ := json.Marshal(userPayload)

	req, _ := http.NewRequest("POST", baseURL+"/api/users", bytes.NewBuffer(userBody))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	req.Header.Set("X-User-Email", "admin@example.com")

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		log.Printf("Add User failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ = ioutil.ReadAll(resp.Body)
	log.Printf("Add User Response Status: %s\n", resp.Status)
	log.Printf("Add User Response Body: %s\n", string(body))
}
