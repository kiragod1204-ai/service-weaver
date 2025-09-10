package api

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"net/http"
	"service-weaver/internal/middleware"
	"service-weaver/internal/models"
	"service-weaver/internal/monitoring"
	"service-weaver/internal/repository"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/image/draw"
)

type Handlers struct {
	repo      *repository.Repository
	scheduler *monitoring.HealthcheckScheduler
	upgrader  websocket.Upgrader
}

func NewHandlers(repo *repository.Repository, scheduler *monitoring.HealthcheckScheduler) *Handlers {
	return &Handlers{
		repo:      repo,
		scheduler: scheduler,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins in development
			},
		},
	}
}

// WebSocket handler
func (h *Handlers) HandleWebSocket(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	h.scheduler.AddClient(conn)

	// Handle client disconnection
	defer h.scheduler.RemoveClient(conn)

	// Keep connection alive
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

// Diagram handlers
func (h *Handlers) CreateDiagram(c *gin.Context) {
	var diagram models.Diagram
	if err := c.ShouldBindJSON(&diagram); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.CreateDiagram(&diagram); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, diagram)
}

func (h *Handlers) GetDiagrams(c *gin.Context) {
	userRole, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var diagrams []models.Diagram
	var err error

	if userRole == models.RoleAdmin {
		diagrams, err = h.repo.GetDiagrams()
	} else {
		// For non-admin users, fetch all diagrams and filter public ones on the backend
		// Alternatively, create a GetPublicDiagrams method in the repo
		allDiagrams, err := h.repo.GetDiagrams()
		if err == nil {
			for _, d := range allDiagrams {
				if d.Public {
					diagrams = append(diagrams, d)
				}
			}
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, diagrams)
}

func (h *Handlers) GetDiagram(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid diagram ID"})
		return
	}

	diagram, err := h.repo.GetDiagram(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Diagram not found"})
		return
	}

	// Get services and connections for this diagram
	services, err := h.repo.GetServices(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	connections, err := h.repo.GetConnections(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{
		"diagram":     diagram,
		"services":    services,
		"connections": connections,
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handlers) UpdateDiagram(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid diagram ID"})
		return
	}

	var diagram models.Diagram
	if err := c.ShouldBindJSON(&diagram); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	diagram.ID = id
	if err := h.repo.UpdateDiagram(&diagram); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, diagram)
}

func (h *Handlers) DeleteDiagram(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid diagram ID"})
		return
	}

	if err := h.repo.DeleteDiagram(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Diagram deleted"})
}

// Service handlers
func (h *Handlers) CreateService(c *gin.Context) {
	var service models.Service
	if err := c.ShouldBindJSON(&service); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.CreateService(&service); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, service)
}

func (h *Handlers) GetServices(c *gin.Context) {
	diagramID, err := strconv.Atoi(c.Param("diagramId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid diagram ID"})
		return
	}

	services, err := h.repo.GetServices(diagramID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, services)
}

func (h *Handlers) UpdateService(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	var service models.Service
	if err := c.ShouldBindJSON(&service); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	service.ID = id
	if err := h.repo.UpdateService(&service); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, service)
}

func (h *Handlers) DeleteService(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	if err := h.repo.DeleteService(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service deleted"})
}

// Connection handlers
func (h *Handlers) CreateConnection(c *gin.Context) {
	var connection models.Connection
	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.CreateConnection(&connection); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, connection)
}

func (h *Handlers) GetConnections(c *gin.Context) {
	diagramID, err := strconv.Atoi(c.Param("diagramId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid diagram ID"})
		return
	}

	connections, err := h.repo.GetConnections(diagramID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, connections)
}

func (h *Handlers) DeleteConnection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid connection ID"})
		return
	}

	if err := h.repo.DeleteConnection(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Connection deleted"})
}

func (h *Handlers) UpdateConnection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid connection ID"})
		return
	}

	var connection models.Connection
	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	connection.ID = id
	if err := h.repo.UpdateConnection(&connection); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, connection)
}

// SavePositions handles the saving of service positions for a diagram.
func (h *Handlers) SavePositions(c *gin.Context) {
	diagramID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid diagram ID"})
		return
	}

	var requestBody struct {
		Positions []models.ServicePosition `json:"positions"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.SaveServicePositions(diagramID, requestBody.Positions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Positions saved successfully"})
}

// Authentication handlers
func (h *Handlers) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if this is first run (no users exist)
	isFirstRun, err := h.repo.CheckFirstRun()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check system status"})
		return
	}

	// If this is first run and username is "admin", treat it as admin setup
	if isFirstRun && req.Username == "admin" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "First run setup required. Please use the first-run admin setup endpoint."})
		return
	}

	user, err := h.repo.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	var token string
	// Check if remember me is requested
	if req.RememberMe {
		token, err = middleware.GenerateRefreshToken(*user)
	} else {
		token, err = middleware.GenerateJWT(*user)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{Token: token, User: *user})
}

// FirstRunAdmin handles the first-run admin setup
func (h *Handlers) FirstRunAdmin(c *gin.Context) {
	var req models.FirstRunAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if this is actually first run
	isFirstRun, err := h.repo.CheckFirstRun()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check system status"})
		return
	}

	if !isFirstRun {
		c.JSON(http.StatusConflict, gin.H{"error": "Admin user already exists"})
		return
	}

	// Create the first admin user
	user, err := h.repo.CreateFirstRunAdmin(req.Username, req.Password, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin user"})
		return
	}

	// Generate token for the new admin
	token, err := middleware.GenerateJWT(*user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, models.FirstRunAdminResponse{
		Message: "Admin user created successfully",
		User:    *user,
		Token:   token,
	})
}

func (h *Handlers) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	if _, err := h.repo.GetUserByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Email:        req.Email,
		Role:         req.Role,
	}

	if err := h.repo.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// GetUsers returns all users (admin only)
func (h *Handlers) GetUsers(c *gin.Context) {
	users, err := h.repo.GetUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Remove password hashes from response
	for i := range users {
		users[i].PasswordHash = ""
	}

	c.JSON(http.StatusOK, users)
}

// UpdateUser updates a user's information (admin only)
func (h *Handlers) UpdateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Email    string         `json:"email" binding:"required,email"`
		Role     models.UserRole `json:"role" binding:"required,oneof=admin viewer"`
		Password string         `json:"password"` // Optional password
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.repo.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Email = req.Email
	user.Role = req.Role

	// If a new password is provided, hash it and update
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.PasswordHash = string(hashedPassword)
	}

	if err := h.repo.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Don't return the password hash
	user.PasswordHash = ""
	c.JSON(http.StatusOK, user)
}

// DeleteUser deletes a user (admin only)
func (h *Handlers) DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Prevent self-deletion
	userID, exists := c.Get("user_id")
	if exists {
		currentUserID := 0
		switch v := userID.(type) {
		case float64:
			currentUserID = int(v)
		case uint:
			currentUserID = int(v)
		case int:
			currentUserID = v
		}
		if currentUserID == id {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
			return
		}
	}

	if err := h.repo.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// CreateUser creates a new user (admin only)
func (h *Handlers) CreateUser(c *gin.Context) {
	var req models.RegisterRequest // We can reuse the RegisterRequest model
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	if _, err := h.repo.GetUserByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Email:        req.Email,
		Role:         req.Role,
	}

	if err := h.repo.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Don't return the password hash
	user.PasswordHash = ""
	c.JSON(http.StatusCreated, user)
}

// GetCurrentUser returns the current authenticated user
func (h *Handlers) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Handle different possible types for user_id from JWT claims
	var id int
	switch v := userID.(type) {
	case float64:
		id = int(v)
	case uint:
		id = int(v)
	case int:
		id = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	user, err := h.repo.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Don't return the password hash
	user.PasswordHash = ""
	c.JSON(http.StatusOK, user)
}

// UploadServiceIcon handles icon upload for a service
func (h *Handlers) UploadServiceIcon(c *gin.Context) {
	serviceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	// Get the service from the database
	service, err := h.repo.GetServiceByID(serviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Get the file from the form data
	file, err := c.FormFile("icon")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Check file size (5MB limit)
	const maxFileSize = 5 << 20 // 5MB in bytes
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 5MB limit"})
		return
	}

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer src.Close()

	// Read the file data
	fileData := make([]byte, file.Size)
	if _, err := src.Read(fileData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file data"})
		return
	}

	// Process the image (decode, scale, and encode back to bytes)
	processedImage, err := h.processImage(fileData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process image: " + err.Error()})
		return
	}

	// Convert the processed image to base64
	iconBase64 := "data:image/png;base64," + processedImage

	// Update the service icon in the database
	service.Icon = iconBase64
	if err := h.repo.UpdateService(service); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service icon"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Icon uploaded successfully",
		"icon":    iconBase64,
	})
}

// processImage decodes, scales down, and encodes an image
func (h *Handlers) processImage(fileData []byte) (string, error) {
	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(fileData))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %v", err)
	}

	// Define maximum dimensions
	const maxDimension = 128

	// Calculate new dimensions maintaining aspect ratio
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width <= maxDimension && height <= maxDimension {
		// Image is already small enough, just encode it
		return h.encodeImageToBase64(img, format)
	}

	// Calculate scaled dimensions
	var newWidth, newHeight int
	if width > height {
		newWidth = maxDimension
		newHeight = int(float64(height) * float64(maxDimension) / float64(width))
	} else {
		newHeight = maxDimension
		newWidth = int(float64(width) * float64(maxDimension) / float64(height))
	}

	// Create a new image with the scaled dimensions
	dst := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))

	// Scale the image using high-quality scaling
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)

	// Encode the scaled image back to bytes
	return h.encodeImageToBase64(dst, format)
}

// encodeImageToBase64 encodes an image to base64 string
func (h *Handlers) encodeImageToBase64(img image.Image, format string) (string, error) {
	var buf bytes.Buffer
	var err error

	switch format {
	case "jpeg":
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
	case "png":
		err = png.Encode(&buf, img)
	default:
		// Default to PNG for unknown formats
		err = png.Encode(&buf, img)
	}

	if err != nil {
		return "", fmt.Errorf("failed to encode image: %v", err)
	}

	// Convert to base64
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
