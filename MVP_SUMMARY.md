# 食品安全标签检测系统 - MVP版本

## 🎯 MVP核心功能

这是一个简化的MVP版本，专注于核心业务流程：

1. **用户上传图片** 📸
2. **填写检测参数** 📝  
3. **调用Dify API** 🔗
4. **展示检测结果** 📊

## ✨ 简化特性

### ✅ 保留的功能
- 图片上传（支持 JPEG, PNG, PDF）
- 表单参数收集（食品类型、包装类型等）
- Dify Workflow API集成
- Base64图片编码支持
- 详细的调试日志
- API连接测试端点
- CORS跨域支持
- 文件类型验证

### ❌ 移除的复杂功能
- MongoDB数据库集成
- Beanie ORM模型
- 检测记录存储
- 历史记录查询
- 用户管理系统
- 数据持久化
- 复杂的数据模型
- 数据库健康检查

## 📁 文件结构

```
├── backend/
│   ├── main_simple.py          # 简化版主应用（核心）
│   └── main.py                 # 完整版（保留备用）
├── start_simple.sh             # MVP启动脚本
├── run_backend_simple.py       # 简化版后端启动器
├── test_simple.py              # MVP测试脚本
└── MVP_SUMMARY.md              # 本文档
```

## 🚀 使用方法

### 1. 启动完整MVP系统
```bash
./start_simple.sh
```

### 2. 仅启动后端服务
```bash
python run_backend_simple.py
```

### 3. 测试系统功能
```bash
python test_simple.py
```

## 🌐 API端点

### 核心端点
- `POST /api/detect` - 图片检测主接口
- `GET /api/test-dify` - Dify API连接测试
- `GET /health` - 服务健康检查
- `GET /` - 服务信息

### 请求示例
```bash
# 检测接口
curl -X POST "http://localhost:8000/api/detect" \
  -F "file=@image.jpg" \
  -F "Foodtype=饮料" \
  -F "PackageFoodType=预包装食品" \
  -F "SingleOrMulti=单包装" \
  -F "PackageSize=常规包装" \
  -F "检测时间=2024-12-28"

# 测试Dify连接
curl "http://localhost:8000/api/test-dify"
```

## 🔧 技术栈

### 后端（简化版）
- **FastAPI** - Web框架
- **httpx** - HTTP客户端（调用Dify API）
- **python-multipart** - 文件上传支持
- **uvicorn** - ASGI服务器

### 前端（保持不变）
- **React + Vite**
- **Ant Design**
- **现有的前端代码**

## 📋 MVP工作流程

1. **文件上传** 📤
   - 用户选择图片文件
   - 验证文件类型和大小
   - 临时保存到本地

2. **参数收集** 📝
   - 食品类型
   - 包装类型  
   - 包装规格
   - 检测时间
   - 特殊要求（可选）

3. **Dify API调用** 🔗
   - 图片转Base64编码
   - 构建API请求载荷
   - 发送到Dify Workflow
   - 处理响应结果

4. **结果展示** 📊
   - 解析Dify返回数据
   - 格式化检测结果
   - 返回给前端展示

5. **清理** 🧹
   - 删除临时文件
   - 释放资源

## 🔍 调试功能

- 详细的请求/响应日志
- Dify API调用跟踪
- 文件处理过程监控
- 错误堆栈追踪
- 连接测试端点

## 🎉 优势

1. **轻量级** - 无数据库依赖，快速启动
2. **专注核心** - 只关注主要业务流程
3. **易于调试** - 丰富的日志和测试工具
4. **快速迭代** - 简单架构，便于修改
5. **部署简单** - 最少的依赖和配置

## 🔄 升级路径

需要更多功能时，可以：
1. 逐步添加数据存储
2. 引入用户管理
3. 增加历史记录
4. 添加报告导出
5. 集成更多AI服务

当前MVP版本为后续扩展提供了坚实的基础！
