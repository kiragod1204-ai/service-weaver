package api

import (
	"net/http"
	"service-weaver/internal/middleware"
	"service-weaver/internal/models"
	"service-weaver/internal/monitoring"
	"service-weaver/internal/repository"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"golang.org/x/crypto/bcrypt"
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

	user, err := h.repo.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := middleware.GenerateJWT(*user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{Token: token, User: *user})
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
