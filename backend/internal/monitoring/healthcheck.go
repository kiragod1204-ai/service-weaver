package monitoring

import (
	"bufio"
	"context"
	"crypto/tls"
	"database/sql"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"service-weaver/internal/models"
	"service-weaver/internal/repository"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/crypto/ssh"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	
	// Database drivers
	"github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	"github.com/Shopify/sarama"
	_ "github.com/lib/pq"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type HealthcheckScheduler struct {
	repo      *repository.Repository
	clients   map[*websocket.Conn]bool
	clientsMu sync.RWMutex
	broadcast chan models.StatusUpdate
	ctx       context.Context
	cancel    context.CancelFunc
}

func NewHealthcheckScheduler(repo *repository.Repository) *HealthcheckScheduler {
	ctx, cancel := context.WithCancel(context.Background())
	return &HealthcheckScheduler{
		repo:      repo,
		clients:   make(map[*websocket.Conn]bool),
		broadcast: make(chan models.StatusUpdate, 100),
		ctx:       ctx,
		cancel:    cancel,
	}
}

func (h *HealthcheckScheduler) Start() {
	go h.broadcastHandler()
	go h.scheduleHealthchecks()
}

func (h *HealthcheckScheduler) Stop() {
	h.cancel()
}

func (h *HealthcheckScheduler) AddClient(conn *websocket.Conn) {
	h.clientsMu.Lock()
	h.clients[conn] = true
	h.clientsMu.Unlock()
}

func (h *HealthcheckScheduler) RemoveClient(conn *websocket.Conn) {
	h.clientsMu.Lock()
	delete(h.clients, conn)
	h.clientsMu.Unlock()
	conn.Close()
}

func (h *HealthcheckScheduler) broadcastHandler() {
	for {
		select {
		case update := <-h.broadcast:
			h.clientsMu.RLock()
			for client := range h.clients {
				err := client.WriteJSON(update)
				if err != nil {
					log.Printf("Error broadcasting to client: %v", err)
					client.Close()
					delete(h.clients, client)
				}
			}
			h.clientsMu.RUnlock()
		case <-h.ctx.Done():
			return
		}
	}
}

func (h *HealthcheckScheduler) scheduleHealthchecks() {
	ticker := time.NewTicker(5 * time.Second) // Check every 5 seconds for services to check
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			services, err := h.repo.GetAllServices()
			if err != nil {
				log.Printf("Error getting services: %v", err)
				continue
			}

			for _, service := range services {
				if h.shouldCheck(service) {
					go h.performHealthcheck(service)
				}
			}
		case <-h.ctx.Done():
			return
		}
	}
}

func (h *HealthcheckScheduler) shouldCheck(service models.Service) bool {
	if service.Host == "" {
		return false
	}

	// HTTP/HTTPS methods require a URL
	if (service.HealthcheckMethod == "HTTP" || service.HealthcheckMethod == "HTTPS" ||
		service.HealthcheckMethod == "WEBSOCKET" || service.HealthcheckMethod == "WSS" ||
		service.HealthcheckMethod == "GRPC") && service.HealthcheckURL == "" {
		return false
	}

	if service.LastChecked == nil {
		return true
	}

	interval := time.Duration(service.PollingInterval) * time.Second
	return time.Since(*service.LastChecked) >= interval
}

func (h *HealthcheckScheduler) performHealthcheck(service models.Service) {
	start := time.Now()

	// Update status to checking
	h.updateServiceStatus(service.ID, models.StatusChecking)

	responseTime := int(time.Since(start).Milliseconds())
	result := &models.HealthcheckResult{
		ServiceID:    service.ID,
		ResponseTime: responseTime,
		CheckedAt:    time.Now(),
	}

	var status models.ServiceStatus
	var err error

	switch service.HealthcheckMethod {
	case "HTTP", "HTTPS":
		status, err = h.performHTTPHealthcheck(service, result)
	case "TCP":
		status, err = h.performTCPHealthcheck(service, result)
	case "UDP":
		status, err = h.performUDPHealthcheck(service, result)
	case "ICMP":
		status, err = h.performICMPHealthcheck(service, result)
	case "DNS":
		status, err = h.performDNSHealthcheck(service, result)
	case "WEBSOCKET":
		status, err = h.performWebSocketHealthcheck(service, result)
	case "GRPC":
		status, err = h.performGRPCHealthcheck(service, result)
	case "SMTP":
		status, err = h.performSMTPHealthcheck(service, result)
	case "FTP":
		status, err = h.performFTPHealthcheck(service, result)
	case "SSH":
		status, err = h.performSSHHealthcheck(service, result)
	case "REDIS":
		status, err = h.performRedisHealthcheck(service, result)
	case "MYSQL":
		status, err = h.performMySQLHealthcheck(service, result)
	case "POSTGRES":
		status, err = h.performPostgresHealthcheck(service, result)
	case "MONGODB":
		status, err = h.performMongoDBHealthcheck(service, result)
	case "KAFKA":
		status, err = h.performKafkaHealthcheck(service, result)
	default:
		status = models.StatusDead
		err = fmt.Errorf("unsupported health check method: %s", service.HealthcheckMethod)
		result.Error = err.Error()
	}

	result.Status = status
	if err != nil {
		result.Error = err.Error()
	}

	// Save result to database
	if err := h.repo.CreateHealthcheckResult(result); err != nil {
		log.Printf("Error saving healthcheck result: %v", err)
	}

	// Update service status
	h.updateServiceStatus(service.ID, status)
}

func (h *HealthcheckScheduler) performHTTPHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Build URL
	protocol := "http"
	if service.HealthcheckMethod == "HTTPS" {
		protocol = "https"
	}
	url := fmt.Sprintf("%s://%s:%d%s", protocol, service.Host, service.Port, service.HealthcheckURL)

	// Create HTTP client with custom timeout
	client := &http.Client{
		Timeout: time.Duration(service.RequestTimeout) * time.Second,
	}

	// Configure SSL verification
	if service.HealthcheckMethod == "HTTPS" && !service.SSLVerify {
		transport := &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
		client.Transport = transport
	}

	// Create request
	var req *http.Request
	var err error
	
	if service.Body != "" && (service.HTTPMethod == "POST" || service.HTTPMethod == "PUT") {
		var body io.Reader = strings.NewReader(service.Body)
		req, err = http.NewRequest(service.HTTPMethod, url, body)
	} else {
		req, err = http.NewRequest(service.HTTPMethod, url, nil)
	}
	
	if err != nil {
		return models.StatusDead, err
	}

	// Add headers if provided
	if len(service.Headers) > 0 {
		for key, value := range service.Headers {
			if strValue, ok := value.(string); ok {
				req.Header.Set(key, strValue)
			}
		}
	}

	// Set follow redirects
	if !service.FollowRedirects {
		client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		}
	}

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return models.StatusDead, err
	}
	defer resp.Body.Close()

	result.StatusCode = resp.StatusCode
	result.ResponseTime = int(time.Since(start).Milliseconds())

	// Determine status based on status mapping or expected status
	return h.determineStatus(resp.StatusCode, service), nil
}

func (h *HealthcheckScheduler) performTCPHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Attempt to connect
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return models.StatusDead, err
	}
	defer conn.Close()
	
	// If send data is provided, send it
	if service.TCPSendData != "" {
		_, err = conn.Write([]byte(service.TCPSendData))
		if err != nil {
			return models.StatusDead, err
		}
		
		// If expect data is provided, read and check response
		if service.TCPExpectData != "" {
			buffer := make([]byte, 1024)
			n, err := conn.Read(buffer)
			if err != nil {
				return models.StatusDead, err
			}
			
			response := string(buffer[:n])
			if !strings.Contains(response, service.TCPExpectData) {
				return models.StatusDead, fmt.Errorf("expected response '%s' not found in '%s'", service.TCPExpectData, response)
			}
		}
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performUDPHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create connection
	conn, err := net.DialTimeout("udp", address, timeout)
	if err != nil {
		return models.StatusDead, err
	}
	defer conn.Close()
	
	// Set read deadline
	err = conn.SetReadDeadline(time.Now().Add(timeout))
	if err != nil {
		return models.StatusDead, err
	}
	
	// Send data
	if service.UDPSendData == "" {
		return models.StatusDead, fmt.Errorf("UDP send data is required")
	}
	
	_, err = conn.Write([]byte(service.UDPSendData))
	if err != nil {
		return models.StatusDead, err
	}
	
	// If expect data is provided, read and check response
	if service.UDPExpectData != "" {
		buffer := make([]byte, 1024)
		n, err := conn.Read(buffer)
		if err != nil {
			return models.StatusDead, err
		}
		
		response := string(buffer[:n])
		if !strings.Contains(response, service.UDPExpectData) {
			return models.StatusDead, fmt.Errorf("expected response '%s' not found in '%s'", service.UDPExpectData, response)
		}
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performICMPHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Execute ping command
	packetCount := service.ICMPPacketCount
	if packetCount <= 0 {
		packetCount = 3
	}
	
	cmd := exec.Command("ping", "-c", strconv.Itoa(packetCount), "-W", strconv.Itoa(int(timeout.Seconds())), service.Host)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return models.StatusDead, err
	}
	
	// Parse output to check if ping was successful
	outputStr := string(output)
	if strings.Contains(outputStr, "0 received") {
		return models.StatusDead, fmt.Errorf("ping failed: %s", outputStr)
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performDNSHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create DNS resolver
	resolver := &net.Resolver{
		PreferGo: true,
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	// Perform DNS query based on query type
	switch service.DNSQueryType {
	case "A":
		ips, err := resolver.LookupIPAddr(ctx, service.Host)
		if err != nil {
			return models.StatusDead, err
		}
		
		// Check expected result if provided
		if service.DNSExpectedResult != "" {
			found := false
			for _, ip := range ips {
				if ip.IP.String() == service.DNSExpectedResult {
					found = true
					break
				}
			}
			if !found {
				return models.StatusDead, fmt.Errorf("expected IP '%s' not found in DNS response", service.DNSExpectedResult)
			}
		}
		
	case "CNAME":
		cname, err := resolver.LookupCNAME(ctx, service.Host)
		if err != nil {
			return models.StatusDead, err
		}
		
		// Check expected result if provided
		if service.DNSExpectedResult != "" && cname != service.DNSExpectedResult {
			return models.StatusDead, fmt.Errorf("expected CNAME '%s' but got '%s'", service.DNSExpectedResult, cname)
		}
		
	case "MX":
		mxRecords, err := resolver.LookupMX(ctx, service.Host)
		if err != nil {
			return models.StatusDead, err
		}
		
		// Check expected result if provided
		if service.DNSExpectedResult != "" {
			found := false
			for _, mx := range mxRecords {
				if mx.Host == service.DNSExpectedResult {
					found = true
					break
				}
			}
			if !found {
				return models.StatusDead, fmt.Errorf("expected MX record '%s' not found", service.DNSExpectedResult)
			}
		}
		
	case "NS":
		nsRecords, err := resolver.LookupNS(ctx, service.Host)
		if err != nil {
			return models.StatusDead, err
		}
		
		// Check expected result if provided
		if service.DNSExpectedResult != "" {
			found := false
			for _, ns := range nsRecords {
				if ns.Host == service.DNSExpectedResult {
					found = true
					break
				}
			}
			if !found {
				return models.StatusDead, fmt.Errorf("expected NS record '%s' not found", service.DNSExpectedResult)
			}
		}
		
	case "TXT":
		txtRecords, err := resolver.LookupTXT(ctx, service.Host)
		if err != nil {
			return models.StatusDead, err
		}
		
		// Check expected result if provided
		if service.DNSExpectedResult != "" {
			found := false
			for _, txt := range txtRecords {
				if strings.Contains(txt, service.DNSExpectedResult) {
					found = true
					break
				}
			}
			if !found {
				return models.StatusDead, fmt.Errorf("expected TXT record containing '%s' not found", service.DNSExpectedResult)
			}
		}
		
	default:
		return models.StatusDead, fmt.Errorf("unsupported DNS query type: %s", service.DNSQueryType)
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performWebSocketHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Build WebSocket URL
	protocol := "ws"
	if service.HealthcheckMethod == "WSS" {
		protocol = "wss"
	}
	url := fmt.Sprintf("%s://%s:%d%s", protocol, service.Host, service.Port, service.HealthcheckURL)
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create dialer with timeout
	dialer := websocket.Dialer{
		HandshakeTimeout: timeout,
	}
	
	// Skip SSL verification if needed
	if protocol == "wss" && !service.SSLVerify {
		dialer.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}
	
	// Connect to WebSocket
	conn, _, err := dialer.Dial(url, nil)
	if err != nil {
		return models.StatusDead, err
	}
	defer conn.Close()
	
	// Send a ping message
	err = conn.WriteMessage(websocket.PingMessage, []byte{})
	if err != nil {
		return models.StatusDead, err
	}
	
	// Wait for pong response
	_, _, err = conn.ReadMessage()
	if err != nil {
		return models.StatusDead, err
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performGRPCHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create gRPC connection
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	conn, err := grpc.Dial(address, grpc.WithInsecure(), grpc.WithTimeout(timeout))
	if err != nil {
		return models.StatusDead, err
	}
	defer conn.Close()
	
	// Create health client
	client := healthpb.NewHealthClient(conn)
	
	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	// Check health
	resp, err := client.Check(ctx, &healthpb.HealthCheckRequest{
		Service: service.HealthcheckURL,
	})
	if err != nil {
		return models.StatusDead, err
	}
	
	// Check response status
	if resp.Status != healthpb.HealthCheckResponse_SERVING {
		return models.StatusDegraded, fmt.Errorf("gRPC service status: %s", resp.Status)
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performSMTPHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Create SMTP client
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	client, err := smtp.Dial(address)
	if err != nil {
		return models.StatusDead, err
	}
	defer client.Close()
	
	// Send NOOP command to check if server is responsive
	err = client.Noop()
	if err != nil {
		return models.StatusDead, err
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performFTPHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create FTP connection
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return models.StatusDead, err
	}
	defer conn.Close()
	
	// Set read deadline
	err = conn.SetReadDeadline(time.Now().Add(timeout))
	if err != nil {
		return models.StatusDead, err
	}
	
	// Read welcome message
	reader := bufio.NewReader(conn)
	_, err = reader.ReadString('\n')
	if err != nil {
		return models.StatusDead, err
	}
	
	// Send QUIT command
	_, err = conn.Write([]byte("QUIT\r\n"))
	if err != nil {
		return models.StatusDead, err
	}
	
	// Read response
	_, err = reader.ReadString('\n')
	if err != nil {
		return models.StatusDead, err
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performSSHHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create SSH client config
	config := &ssh.ClientConfig{
		User: "healthcheck",
		Auth: []ssh.AuthMethod{
			ssh.Password("healthcheck"),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:        timeout,
	}
	
	// Create SSH connection
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	conn, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return models.StatusDead, err
	}
	defer conn.Close()
	
	// Create session
	session, err := conn.NewSession()
	if err != nil {
		return models.StatusDead, err
	}
	defer session.Close()
	
	// Run a simple command
	output, err := session.Output("echo 'healthcheck'")
	if err != nil {
		return models.StatusDead, err
	}
	
	// Check output
	if string(output) != "healthcheck\n" {
		return models.StatusDead, fmt.Errorf("unexpected SSH output: %s", string(output))
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performRedisHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create Redis client
	address := fmt.Sprintf("%s:%d", service.Host, service.Port)
	client := redis.NewClient(&redis.Options{
		Addr:     address,
		Password: "", // No password by default
		DB:       0,  // Default DB
	})
	
	// Set context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	// Ping Redis
	_, err := client.Ping(ctx).Result()
	if err != nil {
		return models.StatusDead, err
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performMySQLHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Build DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/", "healthcheck", "healthcheck", service.Host, service.Port)
	
	// Connect to MySQL
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return models.StatusDead, err
	}
	defer db.Close()
	
	// Set connection timeout
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(timeout)
	
	// Ping database
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	err = db.PingContext(ctx)
	if err != nil {
		return models.StatusDead, err
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performPostgresHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Get database connection parameters from environment variables with defaults
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbName := getEnv("DB_NAME", "service_weaver")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")
	
	// Use frontend host URL if specified, otherwise use service host
	host := service.Host
	if service.FrontendHostURL != "" {
		// Extract host from frontend URL (remove protocol and path)
		frontendURL := service.FrontendHostURL
		// Remove protocol if present
		if strings.HasPrefix(frontendURL, "http://") {
			frontendURL = frontendURL[7:]
		} else if strings.HasPrefix(frontendURL, "https://") {
			frontendURL = frontendURL[8:]
		}
		// Remove path and port if present
		if strings.Contains(frontendURL, "/") {
			frontendURL = strings.Split(frontendURL, "/")[0]
		}
		if strings.Contains(frontendURL, ":") {
			frontendURL = strings.Split(frontendURL, ":")[0]
		}
		host = frontendURL
	}
	
	// Build connection string with configurable parameters
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s connect_timeout=%d",
		host, service.Port, dbUser, dbPassword, dbName, dbSSLMode, int(timeout.Seconds()))
	
	// Connect to PostgreSQL
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return models.StatusDead, fmt.Errorf("failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()
	
	// Set connection timeouts
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(timeout)
	
	// Ping database
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	err = db.PingContext(ctx)
	if err != nil {
		return models.StatusDead, fmt.Errorf("PostgreSQL ping failed: %v", err)
	}
	
	// Additionally, execute a simple query to verify the connection is fully functional
	var version string
	err = db.QueryRowContext(ctx, "SELECT version()").Scan(&version)
	if err != nil {
		return models.StatusDegraded, fmt.Errorf("PostgreSQL query failed: %v", err)
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performMongoDBHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Build connection string
	connStr := fmt.Sprintf("mongodb://%s:%d", service.Host, service.Port)
	
	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(connStr))
	if err != nil {
		return models.StatusDead, err
	}
	defer client.Disconnect(ctx)
	
	// Ping MongoDB
	err = client.Ping(ctx, nil)
	if err != nil {
		return models.StatusDead, err
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) performKafkaHealthcheck(service models.Service, result *models.HealthcheckResult) (models.ServiceStatus, error) {
	start := time.Now()
	
	// Set timeout
	timeout := time.Duration(service.RequestTimeout) * time.Second
	
	// Create Kafka configuration
	config := sarama.NewConfig()
	config.ClientID = service.KafkaClientID
	if config.ClientID == "" {
		config.ClientID = "service-weaver-healthcheck"
	}
	
	// Set timeouts
	config.Net.DialTimeout = timeout
	config.Net.ReadTimeout = timeout
	config.Net.WriteTimeout = timeout
	
	// Create Kafka client
	brokers := []string{fmt.Sprintf("%s:%d", service.Host, service.Port)}
	client, err := sarama.NewClient(brokers, config)
	if err != nil {
		return models.StatusDead, err
	}
	defer client.Close()
	
	// Check if broker is connected
	if !client.Closed() {
		// Get controller to verify connection
		_, err = client.Controller()
		if err != nil {
			return models.StatusDead, err
		}
		
		// Get broker metadata
		brokers := client.Brokers()
		if len(brokers) == 0 {
			return models.StatusDead, fmt.Errorf("no brokers available")
		}
		
		// If topic is specified, check if it exists
		if service.KafkaTopic != "" {
			topics, err := client.Topics()
			if err != nil {
				return models.StatusDead, err
			}
			
			topicExists := false
			for _, topic := range topics {
				if topic == service.KafkaTopic {
					topicExists = true
					break
				}
			}
			
			if !topicExists {
				return models.StatusDegraded, fmt.Errorf("topic '%s' does not exist", service.KafkaTopic)
			}
			
			// Get topic metadata
			partitions, err := client.Partitions(service.KafkaTopic)
			if err != nil {
				return models.StatusDegraded, err
			}
			
			// Check if topic has at least one partition
			if len(partitions) == 0 {
				return models.StatusDegraded, fmt.Errorf("topic '%s' has no partitions", service.KafkaTopic)
			}
		}
	} else {
		return models.StatusDead, fmt.Errorf("kafka client is closed")
	}
	
	result.ResponseTime = int(time.Since(start).Milliseconds())
	return models.StatusAlive, nil
}

func (h *HealthcheckScheduler) determineStatus(statusCode int, service models.Service) models.ServiceStatus {
	// Check custom status mapping first
	if len(service.StatusMapping) > 0 {
		if statusStr, ok := service.StatusMapping[fmt.Sprintf("%d", statusCode)]; ok {
			if status, ok := statusStr.(string); ok {
				switch status {
				case "alive":
					return models.StatusAlive
				case "degraded":
					return models.StatusDegraded
				case "dead":
					return models.StatusDead
				}
			}
		}
	}

	// Fall back to expected status code
	if statusCode == service.ExpectedStatus {
		return models.StatusAlive
	}

	// Special cases
	if statusCode == 429 || statusCode == 503 {
		return models.StatusDegraded
	}

	return models.StatusDead
}

func (h *HealthcheckScheduler) updateServiceStatus(serviceID int, status models.ServiceStatus) {
	if err := h.repo.UpdateServiceStatus(serviceID, status); err != nil {
		log.Printf("Error updating service status: %v", err)
		return
	}

	// Broadcast status update
	update := models.StatusUpdate{
		ServiceID: serviceID,
		Status:    status,
		Timestamp: time.Now(),
	}

	select {
	case h.broadcast <- update:
	default:
		log.Printf("Broadcast channel full, dropping update")
	}
}

// Helper function to get environment variable with default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
