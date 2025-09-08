package middleware

import (
	"net/http"
	"service-weaver/internal/models"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// RequireRole is a middleware that checks if the user has the required role
func RequireRole(role models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		if userRole != role {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAdmin is a shortcut for RequireRole(models.RoleAdmin)
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// OptionalAuth is a middleware that checks for a token but doesn't require it
// Useful for endpoints that can work both authenticated and unauthenticated
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next() // No token, proceed without setting user context
			return
		}

		// Token exists, try to validate it
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.Next() // Invalid format, proceed without setting user context
			return
		}

		tokenString := parts[1]
		claims := &jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JwtKey, nil
		})

		if err != nil || !token.Valid {
			c.Next() // Invalid token, proceed without setting user context
			return
		}

		// Set user information in context if token is valid
		if claims, ok := token.Claims.(*jwt.MapClaims); ok && token.Valid {
			userID := uint((*claims)["user_id"].(float64))
			username := (*claims)["username"].(string)
			role := models.UserRole((*claims)["role"].(string))

			c.Set("user_id", userID)
			c.Set("username", username)
			c.Set("user_role", role)
		}

		c.Next()
	}
}
