# 食品安全标签检测系统 - MongoDB 配置指南

## 数据库配置

### MongoDB 连接信息
- **主机**: 114.215.204.62
- **端口**: 27017
- **用户名**: jfj
- **密码**: 123abc
- **数据库**: food_safety

### 连接字符串
```
mongodb://jfj:123abc@114.215.204.62:27017/food_safety?authSource=admin
```

## 数据库集合结构

### 1. detection_records (检测记录)
存储详细的检测结果数据

```javascript
{
  "_id": ObjectId("..."),
  "product_name": "稻香村月饼富贵佳礼盒（广式月饼）",
  "product_type": "直接消费者",
  "package_size_category": "常规包装（>35cm²）",
  "detection_time": ISODate("2024-12-28T00:00:00Z"),
  "overall_rating": "基本合格",
  "compliance_rate": 75.0,
  "key_issues": 2,
  "general_issues": 3,
  "low_risk_issues": 0,
  "detection_result": {
    "基本信息": {...},
    "合规性评估": {...},
    "详细检测结果": [...],
    "不规范内容汇总": {...},
    "整改优先级排序": [...]
  },
  "created_at": ISODate("2024-12-28T10:30:00Z"),
  "updated_at": ISODate("2024-12-28T10:30:00Z")
}
```

### 2. uploaded_files (上传文件)
记录上传的文件信息

```javascript
{
  "_id": ObjectId("..."),
  "filename": "food_label_001.jpg",
  "original_filename": "食品标签.jpg",
  "file_path": "/app/uploads/food_label_001.jpg",
  "file_size": 1024000,
  "file_type": "image/jpeg",
  "detection_id": ObjectId("..."),
  "uploaded_at": ISODate("2024-12-28T10:30:00Z")
}
```

### 3. users (用户)
用户账户信息

```javascript
{
  "_id": ObjectId("..."),
  "username": "admin",
  "email": "admin@foodsafety.com",
  "password_hash": "$2b$12$...",
  "full_name": "系统管理员",
  "is_active": true,
  "created_at": ISODate("2024-12-28T10:30:00Z"),
  "updated_at": ISODate("2024-12-28T10:30:00Z")
}
```

### 4. detection_history (检测历史)
用于快速查询的历史记录

```javascript
{
  "_id": ObjectId("..."),
  "detection_id": ObjectId("..."),
  "product_name": "稻香村月饼富贵佳礼盒（广式月饼）",
  "product_type": "直接消费者",
  "detection_time": ISODate("2024-12-28T00:00:00Z"),
  "overall_rating": "基本合格",
  "compliance_rate": 75.0,
  "issue_count": 4
}
```

## 索引配置

### detection_records 索引
- `product_name`: 产品名称查询
- `detection_time`: 检测时间查询
- `overall_rating`: 评级查询
- `product_type`: 产品类型查询

### uploaded_files 索引
- `detection_id`: 检测记录关联查询
- `uploaded_at`: 上传时间查询
- `file_type`: 文件类型查询

### users 索引
- `username`: 用户名唯一索引
- `email`: 邮箱唯一索引

### detection_history 索引
- `detection_time`: 检测时间查询
- `overall_rating`: 评级查询
- `product_type`: 产品类型查询

## 环境变量配置

在 Docker 环境中，通过环境变量配置数据库连接：

```yaml
environment:
  - MONGODB_HOST=114.215.204.62
  - MONGODB_PORT=27017
  - MONGODB_USERNAME=jfj
  - MONGODB_PASSWORD=123abc
  - MONGODB_DATABASE=food_safety
```

## 数据库操作示例

### 连接数据库
```python
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://jfj:123abc@114.215.204.62:27017/food_safety?authSource=admin")
db = client.food_safety
```

### 查询检测记录
```python
# 查询所有检测记录
records = await db.detection_records.find().to_list(1000)

# 按产品名称查询
records = await db.detection_records.find({"product_name": {"$regex": "月饼"}}).to_list(1000)

# 按时间范围查询
from datetime import datetime
start_date = datetime(2024, 12, 1)
end_date = datetime(2024, 12, 31)
records = await db.detection_records.find({
    "detection_time": {"$gte": start_date, "$lte": end_date}
}).to_list(1000)
```

### 插入检测记录
```python
record = {
    "product_name": "测试产品",
    "product_type": "直接消费者",
    "package_size_category": "常规包装（>35cm²）",
    "detection_time": datetime.now(),
    "overall_rating": "合格",
    "compliance_rate": 95.0,
    "key_issues": 0,
    "general_issues": 1,
    "low_risk_issues": 0,
    "detection_result": {...},
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

result = await db.detection_records.insert_one(record)
```

### 更新记录
```python
await db.detection_records.update_one(
    {"_id": ObjectId("...")},
    {"$set": {"updated_at": datetime.now()}}
)
```

### 删除记录
```python
await db.detection_records.delete_one({"_id": ObjectId("...")})
```

## 数据备份和恢复

### 备份数据库
```bash
# 备份整个数据库
mongodump --host 114.215.204.62 --port 27017 --username jfj --password 123abc --db food_safety --out backup/

# 备份特定集合
mongodump --host 114.215.204.62 --port 27017 --username jfj --password 123abc --db food_safety --collection detection_records --out backup/
```

### 恢复数据库
```bash
# 恢复整个数据库
mongorestore --host 114.215.204.62 --port 27017 --username jfj --password 123abc --db food_safety backup/food_safety/

# 恢复特定集合
mongorestore --host 114.215.204.62 --port 27017 --username jfj --password 123abc --db food_safety --collection detection_records backup/food_safety/detection_records.bson
```

## 性能优化

### 1. 索引优化
- 为常用查询字段创建索引
- 使用复合索引优化多字段查询
- 定期分析查询性能

### 2. 数据分页
```python
# 使用 skip 和 limit 进行分页
page = 1
page_size = 10
skip = (page - 1) * page_size

records = await db.detection_records.find().skip(skip).limit(page_size).to_list()
```

### 3. 聚合查询
```python
# 统计各评级数量
pipeline = [
    {"$group": {"_id": "$overall_rating", "count": {"$sum": 1}}}
]
stats = await db.detection_records.aggregate(pipeline).to_list()
```

## 监控和维护

### 1. 数据库状态监控
```python
# 获取数据库统计信息
stats = await db.command("dbStats")
print(f"数据库大小: {stats['dataSize']} bytes")
print(f"存储大小: {stats['storageSize']} bytes")
print(f"索引大小: {stats['indexSize']} bytes")
```

### 2. 连接池配置
```python
# 配置连接池
client = AsyncIOMotorClient(
    "mongodb://jfj:123abc@114.215.204.62:27017/food_safety?authSource=admin",
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=30000
)
```

### 3. 错误处理
```python
try:
    result = await db.detection_records.find_one({"_id": ObjectId("...")})
except Exception as e:
    print(f"数据库操作失败: {e}")
    # 处理错误
```

## 安全注意事项

1. **访问控制**: 确保只有授权用户能访问数据库
2. **数据加密**: 敏感数据应进行加密存储
3. **备份策略**: 定期备份重要数据
4. **监控日志**: 监控数据库访问日志
5. **更新维护**: 定期更新MongoDB版本和安全补丁
