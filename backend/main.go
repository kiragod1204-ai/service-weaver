package main

import (
	"fmt"
	"log"
	"os"
	"service-weaver/internal/api"
	"service-weaver/internal/middleware"
	"service-weaver/internal/monitoring"
	"service-weaver/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Get database connection parameters from environment variables
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5430")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbName := getEnv("DB_NAME", "service_weaver")

	// Initialize repository with PostgreSQL connection string
	connStr := buildConnectionString(dbHost, dbPort, dbUser, dbPassword, dbName)
	repo, err := repository.New(connStr)
	if err != nil {
		log.Fatal("Failed to initialize repository:", err)
	}
	defer repo.Close()

	// Initialize healthcheck scheduler
	scheduler := monitoring.NewHealthcheckScheduler(repo)
	scheduler.Start()
	defer scheduler.Stop()

	// Initialize handlers
	handlers := api.NewHandlers(repo, scheduler)

	// Setup Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// WebSocket endpoint
	r.GET("/ws", handlers.HandleWebSocket)

	// API routes
	api := r.Group("/api")
	{
		// Authentication routes (no auth required)
		api.POST("/login", handlers.Login)
		api.POST("/first-run-admin", handlers.FirstRunAdmin)

		// Public monitoring routes (no auth required for read-only access)
		public := api.Group("/")
		{
			// Public diagram access for monitoring
			public.GET("/diagrams/:id", handlers.GetDiagram)
			public.GET("/services/diagram/:diagramId", handlers.GetServices)
			public.GET("/connections/diagram/:diagramId", handlers.GetConnections)
		}

		// Protected routes (require authentication)
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			protected.GET("/user/me", handlers.GetCurrentUser)

			// Admin-only routes
			admin := protected.Group("/")
			admin.Use(middleware.RequireAdmin())
			{
				// User management routes (admin only)
				admin.POST("/users", handlers.CreateUser)
				admin.GET("/users", handlers.GetUsers)
				admin.PUT("/users/:id", handlers.UpdateUser)
				admin.DELETE("/users/:id", handlers.DeleteUser)
			}

			// Diagram routes
			protected.POST("/diagrams", handlers.CreateDiagram)
			protected.GET("/diagrams", handlers.GetDiagrams)
			protected.PUT("/diagrams/:id", handlers.UpdateDiagram)
			protected.DELETE("/diagrams/:id", handlers.DeleteDiagram)
			protected.POST("/diagrams/:id/positions", handlers.SavePositions)

			// Service routes
			protected.POST("/services", handlers.CreateService)
			protected.PUT("/services/:id", handlers.UpdateService)
			protected.DELETE("/services/:id", handlers.DeleteService)
			protected.POST("/services/:id/icon", handlers.UploadServiceIcon)

			// Connection routes
			protected.POST("/connections", handlers.CreateConnection)
			protected.PUT("/connections/:id", handlers.UpdateConnection)
			protected.DELETE("/connections/:id", handlers.DeleteConnection)
		}
	}

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// Helper function to get environment variable with default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// Helper function to build PostgreSQL connection string
func buildConnectionString(host, port, user, password, dbname string) string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)
}
