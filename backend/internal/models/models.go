package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// ServiceStatus represents the health status of a service
type ServiceStatus string

const (
	StatusUnknown  ServiceStatus = "unknown"
	StatusAlive    ServiceStatus = "alive"
	StatusDead     ServiceStatus = "dead"
	StatusDegraded ServiceStatus = "degraded"
	StatusChecking ServiceStatus = "checking"
)

// JSON is a custom type for JSON fields
type JSON map[string]interface{}

func (j JSON) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSON)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// Diagram represents a system diagram
type Diagram struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Public      bool      `json:"public" db:"public"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Service represents a service node in the diagram
type Service struct {
	ID                int           `json:"id" db:"id"`
	DiagramID         int           `json:"diagram_id" db:"diagram_id"`
	Name              string        `json:"name" db:"name"`
	Description       string        `json:"description" db:"description"`
	ServiceType       string        `json:"service_type" db:"service_type"`
	Icon              string        `json:"icon" db:"icon"`
	Host              string        `json:"host" db:"host"`
	Port              int           `json:"port" db:"port"`
	Tags              string        `json:"tags" db:"tags"`
	PositionX         float64       `json:"position_x" db:"position_x"`
	PositionY         float64       `json:"position_y" db:"position_y"`
	HealthcheckMethod string        `json:"healthcheck_method" db:"healthcheck_method"`
	HealthcheckURL    string        `json:"healthcheck_url" db:"healthcheck_url"`
	PollingInterval   int           `json:"polling_interval" db:"polling_interval"`
	RequestTimeout    int           `json:"request_timeout" db:"request_timeout"`
	ExpectedStatus    int           `json:"expected_status" db:"expected_status"`
	StatusMapping     JSON          `json:"status_mapping" db:"status_mapping"`
	HTTPMethod        string        `json:"http_method" db:"http_method"`
	Headers           JSON          `json:"headers" db:"headers"`
	Body              string        `json:"body" db:"body"`
	SSLVerify         bool          `json:"ssl_verify" db:"ssl_verify"`
	FollowRedirects   bool          `json:"follow_redirects" db:"follow_redirects"`
	TCPSendData       string        `json:"tcp_send_data" db:"tcp_send_data"`
	TCPExpectData     string        `json:"tcp_expect_data" db:"tcp_expect_data"`
	UDPSendData       string        `json:"udp_send_data" db:"udp_send_data"`
	UDPExpectData     string        `json:"udp_expect_data" db:"udp_expect_data"`
	ICMPPacketCount   int           `json:"icmp_packet_count" db:"icmp_packet_count"`
	DNSQueryType      string        `json:"dns_query_type" db:"dns_query_type"`
	DNSExpectedResult string        `json:"dns_expected_result" db:"dns_expected_result"`
	KafkaTopic        string        `json:"kafka_topic" db:"kafka_topic"`
	KafkaClientID     string        `json:"kafka_client_id" db:"kafka_client_id"`
	FrontendHostURL   string        `json:"frontend_host_url" db:"frontend_host_url"`
	CurrentStatus     ServiceStatus `json:"current_status" db:"current_status"`
	LastChecked       *time.Time    `json:"last_checked" db:"last_checked"`
	CreatedAt         time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at" db:"updated_at"`
}

// Connection represents a connection between two services
type Connection struct {
	ID        int       `json:"id" db:"id"`
	DiagramID int       `json:"diagram_id" db:"diagram_id"`
	SourceID  int       `json:"source_id" db:"source_id"`
	TargetID  int       `json:"target_id" db:"target_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// ServicePosition represents the position of a service in a diagram
type ServicePosition struct {
	ServiceID int     `json:"service_id" db:"service_id"`
	PositionX float64 `json:"position_x" db:"position_x"`
	PositionY float64 `json:"position_y" db:"position_y"`
}

// HealthcheckResult represents a healthcheck result
type HealthcheckResult struct {
	ID           int           `json:"id" db:"id"`
	ServiceID    int           `json:"service_id" db:"service_id"`
	Status       ServiceStatus `json:"status" db:"status"`
	StatusCode   int           `json:"status_code" db:"status_code"`
	ResponseTime int           `json:"response_time" db:"response_time"`
	Error        string        `json:"error" db:"error"`
	CheckedAt    time.Time     `json:"checked_at" db:"checked_at"`
}

// StatusUpdate represents a real-time status update
type StatusUpdate struct {
	ServiceID int           `json:"service_id"`
	Status    ServiceStatus `json:"status"`
	Timestamp time.Time     `json:"timestamp"`
}

// UserRole represents the role of a user
type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleViewer UserRole = "viewer"
)

// User represents a user in the system
type User struct {
	ID           int       `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"` // Exclude from JSON responses
	Email        string    `json:"email" db:"email"`
	Role         UserRole  `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// LoginRequest represents a user login request
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents a user login response
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// RegisterRequest represents a user registration request
type RegisterRequest struct {
	Username string   `json:"username" binding:"required"`
	Password string   `json:"password" binding:"required"`
	Email    string   `json:"email" binding:"required,email"`
	Role     UserRole `json:"role" binding:"required,oneof=admin viewer"`
}
