// MongoDB 初始化脚本
// 创建数据库和集合

// 切换到目标数据库
db = db.getSiblingDB('food_safety');

// 创建集合
db.createCollection('detection_records');
db.createCollection('uploaded_files');
db.createCollection('users');
db.createCollection('detection_history');

// 创建索引
db.detection_records.createIndex({ "product_name": 1 });
db.detection_records.createIndex({ "detection_time": 1 });
db.detection_records.createIndex({ "overall_rating": 1 });
db.detection_records.createIndex({ "product_type": 1 });

db.uploaded_files.createIndex({ "detection_id": 1 });
db.uploaded_files.createIndex({ "uploaded_at": 1 });
db.uploaded_files.createIndex({ "file_type": 1 });

db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.detection_history.createIndex({ "detection_time": 1 });
db.detection_history.createIndex({ "overall_rating": 1 });
db.detection_history.createIndex({ "product_type": 1 });

// 创建管理员用户（可选）
db.users.insertOne({
    username: "admin",
    email: "admin@foodsafety.com",
    password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2", // 密码: admin123
    full_name: "系统管理员",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
});

print("✅ MongoDB 数据库初始化完成");
print("📊 数据库: food_safety");
print("📋 集合: detection_records, uploaded_files, users, detection_history");
print("🔍 索引已创建");
print("👤 管理员用户已创建 (用户名: admin, 密码: admin123)");
