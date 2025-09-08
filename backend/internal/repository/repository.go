package repository

import (
	"database/sql"
	"fmt"
	"service-weaver/internal/models"

	_ "github.com/lib/pq"
)

type Repository struct {
	db *sql.DB
}

func New(connStr string) (*Repository, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	// Check if connection is working
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	repo := &Repository{db: db}
	if err := repo.createTables(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *Repository) createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			role VARCHAR(50) NOT NULL DEFAULT 'viewer',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS diagrams (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			public BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS services (
			id SERIAL PRIMARY KEY,
			diagram_id INTEGER NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			service_type VARCHAR(50) NOT NULL,
			icon VARCHAR(100),
			host VARCHAR(255),
			port INTEGER,
			tags TEXT,
			position_x REAL DEFAULT 0,
			position_y REAL DEFAULT 0,
			healthcheck_method VARCHAR(20) DEFAULT 'HTTP',
			healthcheck_url TEXT,
			polling_interval INTEGER DEFAULT 30,
			request_timeout INTEGER DEFAULT 5,
			expected_status INTEGER DEFAULT 200,
			status_mapping JSONB DEFAULT '{}',
			http_method VARCHAR(10) DEFAULT 'GET',
			headers JSONB DEFAULT '{}',
			body TEXT,
			ssl_verify BOOLEAN DEFAULT true,
			follow_redirects BOOLEAN DEFAULT true,
			tcp_send_data TEXT,
			tcp_expect_data TEXT,
			udp_send_data TEXT,
			udp_expect_data TEXT,
			icmp_packet_count INTEGER DEFAULT 3,
			dns_query_type VARCHAR(10) DEFAULT 'A',
			dns_expected_result TEXT,
			kafka_topic TEXT,
			kafka_client_id VARCHAR(255) DEFAULT 'service-weaver-healthcheck',
			current_status VARCHAR(20) DEFAULT 'unknown',
			last_checked TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS connections (
			id SERIAL PRIMARY KEY,
			diagram_id INTEGER NOT NULL,
			source_id INTEGER NOT NULL,
			target_id INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE,
			FOREIGN KEY (source_id) REFERENCES services(id) ON DELETE CASCADE,
			FOREIGN KEY (target_id) REFERENCES services(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS healthcheck_results (
			id SERIAL PRIMARY KEY,
			service_id INTEGER NOT NULL,
			status VARCHAR(20) NOT NULL,
			status_code INTEGER,
			response_time INTEGER,
			error TEXT,
			checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
		)`,
	}

	for _, query := range queries {
		if _, err := r.db.Exec(query); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	// Add new columns for Kafka healthcheck if they don't exist
	alterQueries := []string{
		`DO $$
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'kafka_topic') THEN
				ALTER TABLE services ADD COLUMN kafka_topic TEXT;
			END IF;
		END $$`,
		`DO $$
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'kafka_client_id') THEN
				ALTER TABLE services ADD COLUMN kafka_client_id VARCHAR(255) DEFAULT 'service-weaver-healthcheck';
			END IF;
		END $$`,
		`DO $$
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagrams' AND column_name = 'public') THEN
				ALTER TABLE diagrams ADD COLUMN public BOOLEAN DEFAULT FALSE;
			END IF;
		END $$`,
	}

	for _, query := range alterQueries {
		if _, err := r.db.Exec(query); err != nil {
			return fmt.Errorf("failed to alter table: %w", err)
		}
	}

	return nil
}

// Diagram operations
func (r *Repository) CreateDiagram(diagram *models.Diagram) error {
	query := `INSERT INTO diagrams (name, description, public) VALUES ($1, $2, $3) RETURNING id`
	err := r.db.QueryRow(query, diagram.Name, diagram.Description, diagram.Public).Scan(&diagram.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repository) GetDiagrams() ([]models.Diagram, error) {
	query := `SELECT id, name, description, public, created_at, updated_at FROM diagrams ORDER BY updated_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var diagrams []models.Diagram
	for rows.Next() {
		var d models.Diagram
		err := rows.Scan(&d.ID, &d.Name, &d.Description, &d.Public, &d.CreatedAt, &d.UpdatedAt)
		if err != nil {
			return nil, err
		}
		diagrams = append(diagrams, d)
	}
	return diagrams, nil
}

func (r *Repository) GetDiagram(id int) (*models.Diagram, error) {
	query := `SELECT id, name, description, public, created_at, updated_at FROM diagrams WHERE id = $1`
	var d models.Diagram
	err := r.db.QueryRow(query, id).Scan(&d.ID, &d.Name, &d.Description, &d.Public, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *Repository) UpdateDiagram(diagram *models.Diagram) error {
	query := `UPDATE diagrams SET name = $1, description = $2, public = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`
	_, err := r.db.Exec(query, diagram.Name, diagram.Description, diagram.Public, diagram.ID)
	return err
}

func (r *Repository) DeleteDiagram(id int) error {
	query := `DELETE FROM diagrams WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// Service operations
func (r *Repository) CreateService(service *models.Service) error {
	query := `INSERT INTO services (diagram_id, name, description, service_type, icon, host, port, tags, position_x, position_y, healthcheck_method, healthcheck_url, polling_interval, request_timeout, expected_status, status_mapping, http_method, headers, body, ssl_verify, follow_redirects, tcp_send_data, tcp_expect_data, udp_send_data, udp_expect_data, icmp_packet_count, dns_query_type, dns_expected_result, kafka_topic, kafka_client_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) RETURNING id`
	err := r.db.QueryRow(query, service.DiagramID, service.Name, service.Description, service.ServiceType, service.Icon, service.Host, service.Port, service.Tags, service.PositionX, service.PositionY, service.HealthcheckMethod, service.HealthcheckURL, service.PollingInterval, service.RequestTimeout, service.ExpectedStatus, service.StatusMapping, service.HTTPMethod, service.Headers, service.Body, service.SSLVerify, service.FollowRedirects, service.TCPSendData, service.TCPExpectData, service.UDPSendData, service.UDPExpectData, service.ICMPPacketCount, service.DNSQueryType, service.DNSExpectedResult, service.KafkaTopic, service.KafkaClientID).Scan(&service.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repository) GetServices(diagramID int) ([]models.Service, error) {
	query := `SELECT id, diagram_id, name, description, service_type, icon, host, port, tags, position_x, position_y, healthcheck_method, healthcheck_url, polling_interval, request_timeout, expected_status, status_mapping, http_method, headers, body, ssl_verify, follow_redirects, tcp_send_data, tcp_expect_data, udp_send_data, udp_expect_data, icmp_packet_count, dns_query_type, dns_expected_result, kafka_topic, kafka_client_id, current_status, last_checked, created_at, updated_at FROM services WHERE diagram_id = $1`
	rows, err := r.db.Query(query, diagramID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		err := rows.Scan(&s.ID, &s.DiagramID, &s.Name, &s.Description, &s.ServiceType, &s.Icon, &s.Host, &s.Port, &s.Tags, &s.PositionX, &s.PositionY, &s.HealthcheckMethod, &s.HealthcheckURL, &s.PollingInterval, &s.RequestTimeout, &s.ExpectedStatus, &s.StatusMapping, &s.HTTPMethod, &s.Headers, &s.Body, &s.SSLVerify, &s.FollowRedirects, &s.TCPSendData, &s.TCPExpectData, &s.UDPSendData, &s.UDPExpectData, &s.ICMPPacketCount, &s.DNSQueryType, &s.DNSExpectedResult, &s.KafkaTopic, &s.KafkaClientID, &s.CurrentStatus, &s.LastChecked, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, nil
}

func (r *Repository) GetAllServices() ([]models.Service, error) {
	query := `SELECT id, diagram_id, name, description, service_type, icon, host, port, tags, position_x, position_y, healthcheck_method, healthcheck_url, polling_interval, request_timeout, expected_status, status_mapping, http_method, headers, body, ssl_verify, follow_redirects, tcp_send_data, tcp_expect_data, udp_send_data, udp_expect_data, icmp_packet_count, dns_query_type, dns_expected_result, kafka_topic, kafka_client_id, current_status, last_checked, created_at, updated_at FROM services`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		err := rows.Scan(&s.ID, &s.DiagramID, &s.Name, &s.Description, &s.ServiceType, &s.Icon, &s.Host, &s.Port, &s.Tags, &s.PositionX, &s.PositionY, &s.HealthcheckMethod, &s.HealthcheckURL, &s.PollingInterval, &s.RequestTimeout, &s.ExpectedStatus, &s.StatusMapping, &s.HTTPMethod, &s.Headers, &s.Body, &s.SSLVerify, &s.FollowRedirects, &s.TCPSendData, &s.TCPExpectData, &s.UDPSendData, &s.UDPExpectData, &s.ICMPPacketCount, &s.DNSQueryType, &s.DNSExpectedResult, &s.KafkaTopic, &s.KafkaClientID, &s.CurrentStatus, &s.LastChecked, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, nil
}

func (r *Repository) UpdateService(service *models.Service) error {
	query := `UPDATE services SET name = $1, description = $2, service_type = $3, icon = $4, host = $5, port = $6, tags = $7, position_x = $8, position_y = $9, healthcheck_method = $10, healthcheck_url = $11, polling_interval = $12, request_timeout = $13, expected_status = $14, status_mapping = $15, http_method = $16, headers = $17, body = $18, ssl_verify = $19, follow_redirects = $20, tcp_send_data = $21, tcp_expect_data = $22, udp_send_data = $23, udp_expect_data = $24, icmp_packet_count = $25, dns_query_type = $26, dns_expected_result = $27, kafka_topic = $28, kafka_client_id = $29, updated_at = CURRENT_TIMESTAMP WHERE id = $30`
	_, err := r.db.Exec(query, service.Name, service.Description, service.ServiceType, service.Icon, service.Host, service.Port, service.Tags, service.PositionX, service.PositionY, service.HealthcheckMethod, service.HealthcheckURL, service.PollingInterval, service.RequestTimeout, service.ExpectedStatus, service.StatusMapping, service.HTTPMethod, service.Headers, service.Body, service.SSLVerify, service.FollowRedirects, service.TCPSendData, service.TCPExpectData, service.UDPSendData, service.UDPExpectData, service.ICMPPacketCount, service.DNSQueryType, service.DNSExpectedResult, service.KafkaTopic, service.KafkaClientID, service.ID)
	return err
}

func (r *Repository) UpdateServiceStatus(serviceID int, status models.ServiceStatus) error {
	query := `UPDATE services SET current_status = $1, last_checked = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.db.Exec(query, status, serviceID)
	return err
}

func (r *Repository) DeleteService(id int) error {
	query := `DELETE FROM services WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// Connection operations
func (r *Repository) CreateConnection(connection *models.Connection) error {
	query := `INSERT INTO connections (diagram_id, source_id, target_id) VALUES ($1, $2, $3) RETURNING id`
	err := r.db.QueryRow(query, connection.DiagramID, connection.SourceID, connection.TargetID).Scan(&connection.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repository) GetConnections(diagramID int) ([]models.Connection, error) {
	query := `SELECT id, diagram_id, source_id, target_id, created_at FROM connections WHERE diagram_id = $1`
	rows, err := r.db.Query(query, diagramID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var connections []models.Connection
	for rows.Next() {
		var c models.Connection
		err := rows.Scan(&c.ID, &c.DiagramID, &c.SourceID, &c.TargetID, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		connections = append(connections, c)
	}
	return connections, nil
}

func (r *Repository) DeleteConnection(id int) error {
	query := `DELETE FROM connections WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *Repository) UpdateConnection(connection *models.Connection) error {
	query := `UPDATE connections SET source_id = $1, target_id = $2 WHERE id = $3`
	_, err := r.db.Exec(query, connection.SourceID, connection.TargetID, connection.ID)
	return err
}

// Healthcheck result operations
func (r *Repository) CreateHealthcheckResult(result *models.HealthcheckResult) error {
	query := `INSERT INTO healthcheck_results (service_id, status, status_code, response_time, error) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, result.ServiceID, result.Status, result.StatusCode, result.ResponseTime, result.Error)
	return err
}

// SaveServicePositions updates the positions of services for a given diagram.
func (r *Repository) SaveServicePositions(diagramID int, positions []models.ServicePosition) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`UPDATE services SET position_x = $1, position_y = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND diagram_id = $4`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, pos := range positions {
		_, err = stmt.Exec(pos.PositionX, pos.PositionY, pos.ServiceID, diagramID)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

// User operations
func (r *Repository) CreateUser(user *models.User) error {
	query := `INSERT INTO users (username, password_hash, email, role) VALUES ($1, $2, $3, $4) RETURNING id`
	err := r.db.QueryRow(query, user.Username, user.PasswordHash, user.Email, user.Role).Scan(&user.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repository) GetUserByUsername(username string) (*models.User, error) {
	query := `SELECT id, username, password_hash, email, role, created_at, updated_at FROM users WHERE username = $1`
	var u models.User
	err := r.db.QueryRow(query, username).Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetUserByID(id int) (*models.User, error) {
	query := `SELECT id, username, password_hash, email, role, created_at, updated_at FROM users WHERE id = $1`
	var u models.User
	err := r.db.QueryRow(query, id).Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) Close() error {
	return r.db.Close()
}
