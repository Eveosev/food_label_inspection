# 食品安全标签检测系统

基于React + FastAPI的智能食品标签合规性检测系统，支持图片上传、OCR识别、合规性分析和报告生成。

## 功能特性

### 核心功能
- **图片/文件上传**: 支持JPG、PNG、PDF格式，拖拽上传
- **智能识别**: 基于OCR技术的标签信息自动识别
- **合规检测**: 对照国家标准进行自动合规性分析
- **结果展示**: 详细的检测报告和整改建议
- **历史记录**: 检测历史查询和管理
- **报告导出**: 支持PDF、Excel等格式导出

### 检测项目
- 食品名称标识
- 配料表规范
- 营养标签
- 净含量和规格
- 生产者信息
- 日期标示
- 贮存条件
- 食品生产许可证编号
- 产品标准代号
- 致敏物质提示

## 技术栈

### 前端
- **React 18**: 用户界面框架
- **Ant Design**: UI组件库
- **Vite**: 构建工具
- **ECharts**: 数据可视化
- **Axios**: HTTP客户端

### 后端
- **FastAPI**: Web框架
- **Python 3.8+**: 编程语言
- **OpenCV**: 图像处理
- **EasyOCR**: OCR识别
- **Pillow**: 图像处理

## 项目结构

```
食品安全标签/
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── services/          # API服务
│   └── ...
├── backend/               # 后端源代码
│   └── main.py           # FastAPI应用
├── package.json          # 前端依赖
├── requirements.txt      # 后端依赖
├── vite.config.js        # Vite配置
└── README.md            # 项目说明
```

## 快速开始

### 环境要求
- Node.js 16+
- Python 3.8+
- npm 或 yarn

### 安装依赖

1. **安装前端依赖**
```bash
npm install
```

2. **安装后端依赖**
```bash
pip install -r requirements.txt
```

### 启动服务

1. **启动后端服务**
```bash
cd backend
python main.py
```
后端服务将在 http://localhost:8000 启动

2. **启动前端服务**
```bash
npm run dev
```
前端服务将在 http://localhost:3000 启动

### 访问系统
打开浏览器访问 http://localhost:3000 即可使用系统

## API接口

### 主要接口
- `POST /api/upload` - 文件上传
- `POST /api/detect` - 标签检测
- `GET /api/results/{id}` - 获取检测结果
- `GET /api/history` - 获取历史记录
- `POST /api/save` - 保存检测记录
- `GET /api/export/{id}` - 导出报告

### API文档
启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档

## 使用说明

### 1. 上传文件
- 支持拖拽上传或点击选择文件
- 支持JPG、PNG、PDF格式
- 文件大小限制10MB

### 2. 设置参数
- 选择产品类型（直接消费者/餐饮服务/其他）
- 选择包装面积分类
- 设置检测时间
- 选择特殊要求（可选）

### 3. 开始检测
- 点击"开始智能检测"按钮
- 系统自动分析标签信息
- 生成详细的检测报告

### 4. 查看结果
- 基本信息卡片
- 合规性评估概览
- 详细检测结果表格
- 不规范内容汇总
- 整改优先级排序

## 检测标准

系统基于以下国家标准进行检测：
- GB 7718-2025 食品安全国家标准 预包装食品标签通则
- GB 28050-2011 食品安全国家标准 预包装食品营养标签通则
- GB 13432-2013 食品安全国家标准 预包装特殊膳食用食品标签

## 开发说明

### 前端开发
```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 后端开发
```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 部署说明

### 前端部署
1. 构建生产版本
```bash
npm run build
```

2. 将dist目录部署到Web服务器

### 后端部署
1. 安装依赖
```bash
pip install -r requirements.txt
```

2. 使用生产级WSGI服务器
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 注意事项

1. **文件上传**: 确保上传的图片清晰，文字可读
2. **检测结果**: 系统检测结果仅供参考，具体合规性判断请以相关法律法规为准
3. **数据安全**: 上传的文件和检测结果会临时保存，请注意数据安全

## 技术支持

如有问题，请联系：
- 技术支持: support@foodsafety.com
- 业务咨询: business@foodsafety.com

## 许可证

本项目采用MIT许可证，详见LICENSE文件。 