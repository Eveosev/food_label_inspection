-- 数据库初始化脚本
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建检测记录表
CREATE TABLE IF NOT EXISTS detection_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    package_size_category VARCHAR(100) NOT NULL,
    detection_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_rating VARCHAR(50),
    compliance_rate DECIMAL(5,2),
    key_issues INTEGER DEFAULT 0,
    general_issues INTEGER DEFAULT 0,
    low_risk_issues INTEGER DEFAULT 0,
    detection_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建文件上传记录表
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    detection_id UUID REFERENCES detection_records(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_detection_records_created_at ON detection_records(created_at);
CREATE INDEX IF NOT EXISTS idx_detection_records_product_type ON detection_records(product_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_detection_id ON uploaded_files(detection_id);
