# System Configuration Feature

This feature adds a dynamic configuration management system to the application.

## 1. Components

### Database
- **system_configs**: Stores configuration keys and values.
- **system_config_histories**: Tracks all changes to configurations for audit purposes.

### Backend (Golang)
- **GORM**: Used for ORM and Auto-Migration.
- **Layered Architecture**:
  - `models/config.go`: Data structures.
  - `repository/config_repository.go`: Database operations.
  - `services/config_service.go`: Business logic and validation.
  - `handlers/config_handler.go`: REST API endpoints.

### Frontend (React)
- **Config.jsx**: Main management interface.
- **Features**:
  - CRUD Operations.
  - Dynamic input fields based on Data Type (String, Integer, Boolean, JSON).
  - History Viewer.
  - Search and Filter.

## 2. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/configs` | List configs (params: page, limit, search, type) |
| POST | `/api/configs` | Create new config |
| GET | `/api/configs/{id}` | Get specific config |
| PUT | `/api/configs/{id}` | Update config |
| DELETE | `/api/configs/{id}` | Delete config (Soft delete) |
| GET | `/api/configs/{id}/history` | View change history |

## 3. Deployment

1. **Database**: The application uses GORM AutoMigrate. Simply restart the backend server, and tables will be created automatically. Alternatively, use `migrations/001_create_system_configs.sql`.
2. **Backend**:
   ```bash
   cd Go-pertama
   go mod tidy
   go build
   ./go-pertama.exe
   ```
3. **Frontend**: No build required. Ensure `src/Config.jsx` is accessible.

## 4. Usage

1. Navigate to **Settings > Config** in the sidebar.
2. Click **Add Config** to create a new key.
   - Example: Key=`max_login_attempts`, Type=`integer`, Value=`5`.
3. Edit existing configs to change values. Changes are logged in History.
