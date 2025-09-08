# Service Weaver

Service Weaver is a tool designed for designing, visualizing, and monitoring microservice architectures. It provides a web-based interface for creating interactive system architecture diagrams and offers real-time monitoring capabilities.

## Project Structure

The project is divided into two main parts:

- **`backend/`**: A Go-based server that provides the REST API, handles business logic, authentication, and real-time communication.
- **`frontend/`**: A React-based single-page application that serves as the user interface for interacting with the system.

## Prerequisites

- **Go** (version 1.21 or later)
- **Node.js** (version 16 or later) and npm
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- A running instance of **Redis**, **MySQL/PostgreSQL**, and **MongoDB** (if not using Docker)

## Setup and Installation

### Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Copy the example environment variables file (if available) or create a `.env` file with the necessary configurations (e.g., database credentials, JWT secret, Redis address).
    ```bash
    # Example .env file
    DB_HOST=localhost
    DB_USER=youruser
    DB_PASSWORD=yourpassword
    DB_NAME=yourdb
    JWT_SECRET=yoursupersecretkey
    REDIS_ADDR=localhost:6379
    # ... other variables
    ```

3.  Download the Go module dependencies:
    ```bash
    go mod download
    ```

4.  Run the backend server:
    ```bash
    go run main.go
    ```
    The server will typically start on `http://localhost:8080`.

### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install the Node.js dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```
    The React application will open in your default browser at `http://localhost:3000`. It's configured to proxy API requests to the backend running on `http://localhost:8080`.

## Running with Docker

This project includes `docker-compose.yml` and related Dockerfiles for easier setup.

1.  Ensure Docker and Docker Compose are installed and running on your system.

2.  Build and start the services (backend, frontend, and databases) in detached mode:
    ```bash
    docker-compose up --build -d
    ```

3.  To stop the services, run:
    ```bash
    docker-compose down
    ```

## Usage

Once both the backend and frontend are running:

1.  Open your browser and go to `http://localhost:3000`.
2.  You will be presented with a login page. Use valid credentials to access the application.
3.  After logging in, you can:
    - **Create Diagrams**: Use the `DiagramCanvas` to visually design your microservice architecture by adding `ServiceNode` components and connecting them with `ServiceEdge` components.
    - **Monitor Services**: Switch to the `MonitoringView` to see real-time data and health status of your services, visualized on the `MonitoringCanvas`.
    - **Inspect Components**: Select any node or edge in a diagram to view and edit its properties in the `InspectorPanel`.

## API Endpoints

The backend provides several API endpoints (examples, actual endpoints may vary):

- `POST /api/login`: User authentication.
- `GET /api/diagrams`: Fetch all diagrams for the authenticated user.
- `POST /api/diagrams`: Create a new diagram.
- `GET /api/monitoring/data`: Fetch real-time monitoring data (likely uses WebSockets).
- `GET /api/health`: Health check endpoint.

Refer to the backend's `internal/api/handlers.go` for a complete list and implementation details.

## Key Technologies

- **Backend**:
    - Go
    - Gin-Gonic (Web Framework)
    - JWT (Authentication)
    - Redis (Caching)
    - MySQL/PostgreSQL/MongoDB (Databases)
    - Kafka (Message Queue)
    - WebSockets (Real-time communication)
    - gRPC (RPC)

- **Frontend**:
    - React
    - Zustand (State Management)
    - React Router (Routing)
    - Axios (HTTP Client)
    - React Flow (Diagramming)
    - Tailwind CSS (Styling)
    - Lucide React (Icons)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [Specify License, e.g., MIT License] - see the [LICENSE](LICENSE) file for details. (If no LICENSE file is present, you can add this section or remove it).
