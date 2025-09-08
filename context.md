# Project Context

This document provides a high-level overview of the Service Weaver project, including its backend and frontend components, their technologies, and key functionalities.

## Backend

The backend is a Go-based service named `service-weaver`.

### Technology Stack
- **Language:** Go 1.21
- **Web Framework:** Gin-Gonic (`github.com/gin-gonic/gin`)
- **Database Drivers:**
  - MySQL (`github.com/go-sql-driver/mysql`)
  - PostgreSQL (`github.com/lib/pq`)
  - MongoDB (`go.mongodb.org/mongo-driver`)
- **Caching:** Redis (`github.com/go-redis/redis/v8`)
- **Authentication:** JWT (`github.com/golang-jwt/jwt/v5`)
- **Message Queue:** Kafka (`github.com/Shopify/sarama`)
- **Real-time Communication:** WebSockets (`github.com/gorilla/websocket`)
- **RPC:** gRPC (`google.golang.org/grpc`)
- **CORS:** `github.com/gin-contrib/cors`
- **Cryptography:** `golang.org/x/crypto`

### Key Files & Structure
- **`main.go`**: Entry point of the application.
  - `func main()`: Initializes and runs the server.
  - `func getEnv(key, defaultValue string) string`: Utility for fetching environment variables.
  - `func buildConnectionString(host, port, user, password, dbname string) string`: Utility for building database connection strings.
- **`internal/api/handlers.go`**: Contains HTTP request handlers.
- **`internal/models/models.go`**: Defines data models for the application.
- **`internal/repository/repository.go`**: Handles data access logic, likely interacting with the database.
- **`internal/middleware/`**: Contains middleware for authentication, authorization, and key management.
  - `auth.go`: Authentication logic.
  - `authorization.go`: Authorization logic.
  - `keys.go`: Key management, likely for JWT or other cryptographic purposes.
- **`internal/monitoring/healthcheck.go`**: Health check endpoints for monitoring.
- **`go.mod`**: Defines the module and its dependencies.

### Core Functionalities (Inferred)
- RESTful API services.
- User authentication and authorization using JWT.
- Real-time features via WebSockets.
- Data persistence across multiple database types (SQL and NoSQL).
- Caching with Redis.
- Asynchronous communication with Kafka.
- gRPC support for internal service communication.

## Frontend

The frontend is a React-based web application named `service-weaver-frontend`.

### Technology Stack
- **Language:** JavaScript (React)
- **Build Tool:** Create React App (`react-scripts`)
- **UI Library:** React
- **Styling:** Tailwind CSS (`tailwindcss`), PostCSS (`postcss`), Autoprefixer (`autoprefixer`)
- **State Management:** Zustand (`zustand`)
- **Routing:** React Router (`react-router-dom`)
- **HTTP Client:** Axios (`axios`)
- **Diagramming:** React Flow (`reactflow`)
- **Icons:** Lucide React (`lucide-react`)
- **Testing:** Jest, React Testing Library (`@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`)
- **Development:** TypeScript types (`@types/react`, `@types/react-dom`)

### Key Files & Structure
- **`src/App.js`**: Main application component.
  - `function App()`: The root component that renders the application layout and routes.
  - `const MonitoringView = () =>`: Component for displaying monitoring views, likely using `MonitoringCanvas.js`.
  - `const initializeAuth = async () =>`: Asynchronous function to initialize authentication state, probably by checking for a valid token.
  - `const handleCreateDiagram = async (e) =>`: Asynchronous function to handle the creation of new diagrams.
- **`src/components/`**: Reusable UI components.
  - `DiagramCanvas.js`: Canvas for rendering system architecture diagrams.
  - `DiagramSelector.js`: Component for selecting different diagrams.
  - `InspectorPanel.js`: Panel for inspecting and editing properties of selected diagram elements.
  - `LoginForm.js`: Form for user login.
  - `MonitoringCanvas.js`: Canvas for displaying real-time monitoring data, likely using WebSockets.
  - `ServiceEdge.js`: Represents an edge (connection) between services in a diagram.
  - `ServiceNode.js`: Represents a service node in a diagram.
  - `Sidebar.js`: Navigation sidebar.
- **`src/store/useStore.js`**: Zustand store for global state management.
- **`src/index.css`**: Global CSS styles, likely including Tailwind directives.
- **`src/index.js`**: Entry point for the React application.
- **`package.json`**: Defines project metadata, scripts, and dependencies.
  - **Scripts:** `start`, `build`, `test`, `eject`.
  - **Proxy:** Configured to proxy API requests to `http://localhost:8080` (the backend).

### Core Functionalities (Inferred)
- User authentication and login.
- Interactive system architecture diagramming using React Flow.
- Real-time monitoring of services, likely visualized on `MonitoringCanvas.js`.
- State management for application-wide data using Zustand.
- Client-side routing for different views (diagramming, monitoring, etc.).
- HTTP communication with the backend API via Axios.

## Overall Architecture

The project follows a standard client-server architecture:
- **Frontend:** A Single Page Application (SPA) built with React, responsible for the user interface, user interactions, and displaying data. It communicates with the backend via REST APIs and potentially WebSockets for real-time updates.
- **Backend:** A Go-based REST API server that handles business logic, data persistence, authentication, and real-time communication. It's designed to be modular with separate layers for handlers, models, repositories, and middleware.

The system appears to be a tool for designing, visualizing, and monitoring microservice architectures, given the names "Service Weaver" and components like `DiagramCanvas`, `ServiceNode`, `ServiceEdge`, and `MonitoringCanvas`.
