-- Migration for System Configs

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'system_configs')
BEGIN
    CREATE TABLE system_configs (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        config_key VARCHAR(255) NOT NULL UNIQUE,
        data_type VARCHAR(20) NOT NULL,
        main_value TEXT,
        alternative_value TEXT,
        description TEXT,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        created_by VARCHAR(100),
        updated_at DATETIME2,
        updated_by VARCHAR(100),
        deleted_at DATETIME2
    );
    CREATE INDEX idx_system_configs_deleted_at ON system_configs(deleted_at);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'system_config_histories')
BEGIN
    CREATE TABLE system_config_histories (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        config_id BIGINT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        change_reason TEXT,
        changed_at DATETIME2 DEFAULT GETDATE(),
        changed_by VARCHAR(100),
        ip_address VARCHAR(50),
        CONSTRAINT FK_History_Config FOREIGN KEY (config_id) REFERENCES system_configs(id)
    );
    CREATE INDEX idx_history_config_id ON system_config_histories(config_id);
END
