package middleware

import (
	"log"
	"net/http"
	"service-weaver/internal/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates the JWT token and sets the user in the context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("AuthMiddleware: Checking for Authorization header...")
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Println("AuthMiddleware: Authorization header missing.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}
		log.Printf("AuthMiddleware: Authorization header found: %s...", authHeader[:min(len(authHeader), 30)])

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			log.Println("AuthMiddleware: Invalid authorization format.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}
		log.Println("AuthMiddleware: Authorization format is valid Bearer token.")

		tokenString := parts[1]
		claims := &jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			log.Println("AuthMiddleware: Parsing token with claims...")
			return JwtKey, nil
		})

		if err != nil {
			log.Printf("AuthMiddleware: Error parsing token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		if !token.Valid {
			log.Println("AuthMiddleware: Token is not valid.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		log.Println("AuthMiddleware: Token is valid.")

		// Set user information in context
		if claims, ok := token.Claims.(*jwt.MapClaims); ok && token.Valid {
			log.Println("AuthMiddleware: Claims extracted successfully.")
			userID := uint((*claims)["user_id"].(float64))
			username := (*claims)["username"].(string)
			role := models.UserRole((*claims)["role"].(string))

			log.Printf("AuthMiddleware: UserID: %d, Username: %s, Role: %s", userID, username, role)

			c.Set("user_id", userID)
			c.Set("username", username)
			c.Set("user_role", role)
			log.Println("AuthMiddleware: User information set in context. Calling c.Next().")
		} else {
			log.Println("AuthMiddleware: Failed to cast claims or token invalid.")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// min is a helper function to avoid panics with slicing
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GenerateJWT generates a new JWT token for a user
func GenerateJWT(user models.User) (string, error) {
	return GenerateJWTWithExpiration(user, 24*time.Hour) // Default 24 hours
}

// GenerateJWTWithExpiration generates a new JWT token for a user with custom expiration
func GenerateJWTWithExpiration(user models.User, expiration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      jwt.NewNumericDate(time.Now().Add(expiration)),
		"iat":      jwt.NewNumericDate(time.Now()), // Issued at
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtKey)
}

// GenerateRefreshToken generates a refresh token for longer sessions
func GenerateRefreshToken(user models.User) (string, error) {
	return GenerateJWTWithExpiration(user, 30*24*time.Hour) // 30 days for remember me
}
