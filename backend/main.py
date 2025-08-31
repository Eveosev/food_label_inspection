from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import json
import os
from datetime import datetime
import uuid
from bson import ObjectId
import httpx
import base64
import asyncio
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 导入数据库相关模块
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # 优先尝试相对导入（当作为模块运行时）
    from .database import init_database, close_database, get_database
    from .models import DetectionRecord, UploadedFile, DetectionHistory
except ImportError:
    # 如果相对导入失败，使用绝对导入（当直接运行时）
    try:
        from database import init_database, close_database, get_database
        from models import DetectionRecord, UploadedFile, DetectionHistory
    except ImportError:
        # 最后尝试backend.xxx的形式
        from backend.database import init_database, close_database, get_database
        from backend.models import DetectionRecord, UploadedFile, DetectionHistory

# Dify API配置
DIFY_API_URL = "http://114.215.204.62/v1/workflows/run"
DIFY_API_TOKEN = "app-xBO6kaetqL7HF0avy1cSZMTR"

app = FastAPI(
    title="食品安全标签检测系统API",
    description="基于AI的食品标签合规性检测系统",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 启动和关闭事件
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    await init_database()

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时断开数据库连接"""
    await close_database()

async def call_dify_workflow(image_file_path: str, food_type: str, package_food_type: str, single_or_multi: str, package_size: str):
    """调用Dify Workflow API进行食品标签检测"""
    try:
        logger.info("=" * 60)
        logger.info("开始调用Dify Workflow API")
        logger.info(f"图片文件路径: {image_file_path}")
        logger.info(f"食品类型: {food_type}")
        logger.info(f"包装食品类型: {package_food_type}")
        logger.info(f"单包装或多包装: {single_or_multi}")
        logger.info(f"包装尺寸: {package_size}")
        logger.info(f"Dify API URL: {DIFY_API_URL}")
        logger.info(f"Dify API Token: {DIFY_API_TOKEN[:20]}...")
        
        # 检查文件路径类型，决定使用本地文件还是base64编码
        if image_file_path.startswith("http"):
            # 远程URL方式
            logger.info("使用远程URL方式上传图片")
            tag_image = {
                "type": "image",
                "transfer_method": "remote_url",
                "url": image_file_path
            }
        else:
            # 本地文件，使用base64编码
            logger.info("使用base64编码方式上传图片")
            try:
                with open(image_file_path, "rb") as f:
                    image_data = f.read()
                    image_base64 = base64.b64encode(image_data).decode('utf-8')
                    
                # 获取文件扩展名来确定MIME类型
                file_ext = os.path.splitext(image_file_path)[1].lower()
                mime_type = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg', 
                    '.png': 'image/png',
                    '.pdf': 'application/pdf'
                }.get(file_ext, 'image/jpeg')
                
                tag_image = {
                    "type": "image", 
                    "transfer_method": "local_file",
                    "upload_file_id": f"data:{mime_type};base64,{image_base64}"
                }
            except Exception as e:
                logger.error(f"读取图片文件失败: {str(e)}")
                raise Exception(f"读取图片文件失败: {str(e)}")
        
        # 构建请求数据
        payload = {
            "inputs": {
                "TagImage": [tag_image],
                "Foodtype": food_type,
                "PackageFoodType": package_food_type,
                "SingleOrMulti": single_or_multi,
                "PackageSize": package_size
            },
            "response_mode": "blocking",
            "user": f"user-{uuid.uuid4().hex[:8]}"
        }
        
        logger.info("请求载荷:")
        logger.info(json.dumps(payload, indent=2, ensure_ascii=False))
        
        # 发送请求到Dify API
        logger.info("开始发送HTTP请求到Dify API...")
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    DIFY_API_URL,
                    headers={
                        "Authorization": f"Bearer {DIFY_API_TOKEN}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                logger.info(f"HTTP响应状态码: {response.status_code}")
                logger.info(f"HTTP响应头: {dict(response.headers)}")
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info("Dify API调用成功!")
                    logger.info("响应内容:")
                    logger.info(json.dumps(result, indent=2, ensure_ascii=False))
                    logger.info("=" * 60)
                    return {
                        "success": True,
                        "data": result,
                        "message": "Dify Workflow调用成功"
                    }
                else:
                    error_text = response.text
                    logger.error(f"Dify API调用失败!")
                    logger.error(f"状态码: {response.status_code}")
                    logger.error(f"响应内容: {error_text}")
                    logger.info("=" * 60)
                    return {
                        "success": False,
                        "error": f"Dify API调用失败: {response.status_code} - {error_text}",
                        "message": "检测失败"
                    }
                    
            except httpx.ConnectError as e:
                logger.error(f"连接错误: {str(e)}")
                logger.error("可能的原因:")
                logger.error("1. Dify服务器无法访问")
                logger.error("2. 网络连接问题") 
                logger.error("3. URL地址错误")
                logger.info("=" * 60)
                return {
                    "success": False,
                    "error": f"连接Dify服务器失败: {str(e)}",
                    "message": "无法连接到Dify服务器"
                }
            except httpx.TimeoutException as e:
                logger.error(f"请求超时: {str(e)}")
                logger.info("=" * 60)
                return {
                    "success": False,
                    "error": f"请求超时: {str(e)}",
                    "message": "请求超时"
                }
                
    except Exception as e:
        logger.error(f"发生异常: {str(e)}")
        logger.error(f"异常类型: {type(e).__name__}")
        import traceback
        logger.error(f"堆栈跟踪:\n{traceback.format_exc()}")
        logger.info("=" * 60)
        return {
            "success": False,
            "error": str(e),
            "message": "检测过程中发生错误"
        }

# 模拟检测结果数据
MOCK_DETECTION_RESULT = {
    "基本信息": {
        "产品名称": "稻香村月饼富贵佳礼盒（广式月饼）",
        "产品类型": "直接消费者",
        "包装面积分类": "常规包装（>35cm²）",
        "检测时间": "2024-12-28"
    },
    "合规性评估": {
        "总体评级": "基本合格",
        "关键问题": 2,
        "一般问题": 3,
        "合规率": "75%"
    },
    "详细检测结果": [
        {
            "检测类别": "强制内容",
            "检测项目": "食品名称",
            "标准要求": "应在醒目位置标示反映食品真实属性的专用名称",
            "检测结果": "合格",
            "实际情况": "标示了'稻香村月饼富贵佳礼盒（广式月饼）'",
            "问题描述": "无",
            "风险等级": "无风险",
            "整改建议": "无需整改"
        }
    ]
}

@app.get("/")
async def root():
    return {"message": "食品安全标签检测系统API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查接口"""
    try:
        from .database import database
    except ImportError:
        try:
            from database import database
        except ImportError:
            from backend.database import database
    db_health = await database.health_check()
    return {
        "status": "healthy" if db_health else "unhealthy",
        "database": "connected" if db_health else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/test-dify")
async def test_dify_connection():
    """测试Dify API连接"""
    try:
        logger.info("开始测试Dify API连接...")
        logger.info(f"Dify API URL: {DIFY_API_URL}")
        logger.info(f"Dify API Token: {DIFY_API_TOKEN[:20]}...")
        
        # 构建简单的测试请求
        test_payload = {
            "inputs": {
                "TagImage": [
                    {
                        "type": "text",
                        "data": "test"
                    }
                ],
                "Foodtype": "测试食品",
                "PackageFoodType": "测试包装",
                "SingleOrMulti": "单包装",
                "PackageSize": "小包装"
            },
            "response_mode": "blocking",
            "user": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        logger.info("发送测试请求到Dify API...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                DIFY_API_URL,
                headers={
                    "Authorization": f"Bearer {DIFY_API_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=test_payload
            )
            
            logger.info(f"测试响应状态码: {response.status_code}")
            logger.info(f"测试响应头: {dict(response.headers)}")
            
            result = {
                "success": True,
                "dify_url": DIFY_API_URL,
                "status_code": response.status_code,
                "response_headers": dict(response.headers),
                "response_text": response.text[:500] + "..." if len(response.text) > 500 else response.text,
                "message": "Dify API连接测试完成"
            }
            
            if response.status_code == 200:
                try:
                    response_json = response.json()
                    result["response_json"] = response_json
                except:
                    result["response_json"] = "无法解析为JSON"
            
            return result
            
    except httpx.ConnectError as e:
        logger.error(f"连接Dify API失败: {str(e)}")
        return {
            "success": False,
            "error": f"连接失败: {str(e)}",
            "dify_url": DIFY_API_URL,
            "message": "无法连接到Dify服务器"
        }
    except Exception as e:
        logger.error(f"测试Dify API时发生异常: {str(e)}")
        import traceback
        logger.error(f"异常堆栈: {traceback.format_exc()}")
        return {
            "success": False,
            "error": str(e),
            "message": "测试失败"
        }

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """文件上传接口"""
    try:
        # 检查文件类型
        allowed_types = ["image/jpeg", "image/png", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="不支持的文件类型")
        
        # 检查文件大小 (10MB)
        if file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小超过限制")
        
        # 保存文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_path = os.path.join(upload_dir, f"{file_id}{file_extension}")
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # 保存到数据库
        uploaded_file = UploadedFile(
            filename=f"{file_id}{file_extension}",
            original_filename=file.filename,
            file_path=file_path,
            file_size=file.size,
            file_type=file.content_type
        )
        await uploaded_file.insert()
        
        return {
            "success": True,
            "file_id": str(uploaded_file.id),
            "filename": file.filename,
            "file_path": file_path,
            "message": "文件上传成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

@app.post("/api/detect")
async def detect_label(
    files: List[UploadFile] = File(...),
    Foodtype: str = Form(...),
    PackageFoodType: str = Form(...),
    SingleOrMulti: str = Form(...),
    PackageSize: str = Form(...),
    检测时间: str = Form(...),
    特殊要求: Optional[str] = Form(None)
):
    """标签检测接口 - 调用Dify Workflow API"""
    try:
        # 验证文件
        for file in files:
            if file.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
                raise HTTPException(status_code=400, detail=f"文件 {file.filename} 类型不支持")
        
        # 保存上传的文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(files[0].filename)[1]
        file_path = os.path.join(upload_dir, f"{file_id}{file_extension}")
        
        with open(file_path, "wb") as buffer:
            content = await files[0].read()
            buffer.write(content)
        
        # 调用Dify Workflow API
        dify_result = await call_dify_workflow(
            image_file_path=file_path,
            food_type=Foodtype,
            package_food_type=PackageFoodType,
            single_or_multi=SingleOrMulti,
            package_size=PackageSize
        )
        
        if not dify_result["success"]:
            raise HTTPException(status_code=500, detail=dify_result["error"])
        
        # 解析Dify返回的结果
        dify_data = dify_result["data"]
        
        # 构建检测结果格式
        result = {
            "基本信息": {
                "产品名称": dify_data.get("产品名称", "未知产品"),
                "产品类型": PackageFoodType,
                "包装面积分类": PackageSize,
                "检测时间": 检测时间
            },
            "合规性评估": {
                "总体评级": dify_data.get("总体评级", "待评估"),
                "关键问题": dify_data.get("关键问题", 0),
                "一般问题": dify_data.get("一般问题", 0),
                "合规率": dify_data.get("合规率", "0%")
            },
            "详细检测结果": dify_data.get("详细检测结果", []),
            "dify_raw_result": dify_data  # 保存原始Dify结果
        }
        
        # 解析检测时间
        detection_time = datetime.strptime(检测时间, "%Y-%m-%d")
        
        # 保存检测记录到数据库
        detection_record = DetectionRecord(
            product_name=result["基本信息"]["产品名称"],
            product_type=PackageFoodType,
            package_size_category=PackageSize,
            detection_time=detection_time,
            overall_rating=result["合规性评估"]["总体评级"],
            compliance_rate=float(result["合规性评估"]["合规率"].replace("%", "")),
            key_issues=result["合规性评估"]["关键问题"],
            general_issues=result["合规性评估"]["一般问题"],
            low_risk_issues=result["合规性评估"].get("低风险问题", 0),
            detection_result=result
        )
        await detection_record.insert()
        
        # 保存历史记录
        history_record = DetectionHistory(
            detection_id=detection_record.id,
            product_name=detection_record.product_name,
            product_type=detection_record.product_type,
            detection_time=detection_record.detection_time,
            overall_rating=detection_record.overall_rating,
            compliance_rate=detection_record.compliance_rate,
            issue_count=detection_record.key_issues + detection_record.general_issues + detection_record.low_risk_issues
        )
        await history_record.insert()
        
        return {
            "success": True,
            "detection_id": str(detection_record.id),
            "result": result,
            "dify_result": dify_data,
            "message": "检测完成"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检测失败: {str(e)}")

@app.post("/api/detect-with-dify")
async def detect_with_dify(
    file: UploadFile = File(...),
    Foodtype: str = Form(...),
    PackageFoodType: str = Form(...),
    SingleOrMulti: str = Form(...),
    PackageSize: str = Form(...),
    检测时间: str = Form(...),
    特殊要求: Optional[str] = Form(None)
):
    """新的检测接口 - 专门用于调用Dify Workflow API"""
    try:
        logger.info("=" * 80)
        logger.info("收到新的检测请求 /api/detect-with-dify")
        logger.info(f"文件名: {file.filename}")
        logger.info(f"文件类型: {file.content_type}")
        logger.info(f"文件大小: {file.size}")
        logger.info(f"食品类型: {Foodtype}")
        logger.info(f"包装食品类型: {PackageFoodType}")
        logger.info(f"单包装或多包装: {SingleOrMulti}")
        logger.info(f"包装尺寸: {PackageSize}")
        logger.info(f"检测时间: {检测时间}")
        logger.info(f"特殊要求: {特殊要求}")
        logger.info("=" * 80)
        # 验证文件
        if file.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
            raise HTTPException(status_code=400, detail="不支持的文件类型")
        
        # 保存上传的文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_path = os.path.join(upload_dir, f"{file_id}{file_extension}")
        
        logger.info(f"保存文件到: {file_path}")
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"文件保存成功，文件大小: {len(content)} bytes")
        
        # 检查文件是否存在
        if os.path.exists(file_path):
            logger.info(f"确认文件已保存: {file_path}")
            logger.info(f"文件实际大小: {os.path.getsize(file_path)} bytes")
        else:
            logger.error(f"文件保存失败: {file_path}")
            raise HTTPException(status_code=500, detail="文件保存失败")
        
        # 调用Dify Workflow API
        logger.info("准备调用Dify Workflow API...")
        dify_result = await call_dify_workflow(
            image_file_path=file_path,
            food_type=Foodtype,
            package_food_type=PackageFoodType,
            single_or_multi=SingleOrMulti,
            package_size=PackageSize
        )
        
        logger.info(f"Dify API调用结果: success={dify_result['success']}")
        if not dify_result["success"]:
            logger.error(f"Dify API调用失败: {dify_result['error']}")
            raise HTTPException(status_code=500, detail=dify_result["error"])
        
        logger.info("Dify API调用成功，开始处理返回数据...")
        # 解析Dify返回的结果
        dify_data = dify_result["data"]
        logger.info(f"Dify返回数据类型: {type(dify_data)}")
        logger.info(f"Dify返回数据内容: {json.dumps(dify_data, indent=2, ensure_ascii=False) if isinstance(dify_data, dict) else str(dify_data)}")
        
        # 构建检测结果格式
        result = {
            "基本信息": {
                "产品名称": dify_data.get("产品名称", "未知产品"),
                "产品类型": PackageFoodType,
                "包装面积分类": PackageSize,
                "检测时间": 检测时间
            },
            "合规性评估": {
                "总体评级": dify_data.get("总体评级", "待评估"),
                "关键问题": dify_data.get("关键问题", 0),
                "一般问题": dify_data.get("一般问题", 0),
                "合规率": dify_data.get("合规率", "0%")
            },
            "详细检测结果": dify_data.get("详细检测结果", []),
            "dify_raw_result": dify_data  # 保存原始Dify结果
        }
        
        # 解析检测时间
        detection_time = datetime.strptime(检测时间, "%Y-%m-%d")
        
        # 保存检测记录到数据库
        detection_record = DetectionRecord(
            product_name=result["基本信息"]["产品名称"],
            product_type=PackageFoodType,
            package_size_category=PackageSize,
            detection_time=detection_time,
            overall_rating=result["合规性评估"]["总体评级"],
            compliance_rate=float(result["合规性评估"]["合规率"].replace("%", "")),
            key_issues=result["合规性评估"]["关键问题"],
            general_issues=result["合规性评估"]["一般问题"],
            low_risk_issues=result["合规性评估"].get("低风险问题", 0),
            detection_result=result
        )
        await detection_record.insert()
        
        # 保存历史记录
        history_record = DetectionHistory(
            detection_id=detection_record.id,
            product_name=detection_record.product_name,
            product_type=detection_record.product_type,
            detection_time=detection_record.detection_time,
            overall_rating=detection_record.overall_rating,
            compliance_rate=detection_record.compliance_rate,
            issue_count=detection_record.key_issues + detection_record.general_issues + detection_record.low_risk_issues
        )
        await history_record.insert()
        
        return {
            "success": True,
            "detection_id": str(detection_record.id),
            "result": result,
            "dify_result": dify_data,
            "message": "检测完成"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检测失败: {str(e)}")

@app.get("/api/results/{detection_id}")
async def get_detection_result(detection_id: str):
    """获取检测结果"""
    try:
        # 从数据库查询检测记录
        detection_record = await DetectionRecord.get(ObjectId(detection_id))
        if not detection_record:
            raise HTTPException(status_code=404, detail="检测结果不存在")
        
        return {
            "success": True,
            "detection_id": detection_id,
            "result": detection_record.detection_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取结果失败: {str(e)}")

@app.get("/api/history")
async def get_detection_history(
    page: int = 1,
    page_size: int = 10,
    product_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_type: Optional[str] = None,
    status: Optional[str] = None
):
    """获取检测历史记录"""
    try:
        # 构建查询条件
        query = {}
        
        if product_name:
            query["product_name"] = {"$regex": product_name, "$options": "i"}
        
        if product_type:
            query["product_type"] = product_type
        
        if status:
            query["overall_rating"] = status
        
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
            if end_date:
                date_query["$lte"] = datetime.strptime(end_date, "%Y-%m-%d")
            query["detection_time"] = date_query
        
        # 计算总数
        total = await DetectionHistory.count(query)
        
        # 分页查询
        skip = (page - 1) * page_size
        history_records = await DetectionHistory.find(query).skip(skip).limit(page_size).to_list()
        
        # 转换为前端需要的格式
        history_data = []
        for record in history_records:
            history_data.append({
                "key": str(record.id),
                "产品名称": record.product_name,
                "检测时间": record.detection_time.strftime("%Y-%m-%d"),
                "产品类型": record.product_type,
                "总体评级": record.overall_rating,
                "合规率": f"{record.compliance_rate}%",
                "问题数量": record.issue_count
            })
        
        return {
            "success": True,
            "data": history_data,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史记录失败: {str(e)}")

@app.post("/api/save")
async def save_detection_record(data: dict):
    """保存检测记录"""
    try:
        return {
            "success": True,
            "message": "记录保存成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")

@app.get("/api/export/{detection_id}")
async def export_report(detection_id: str, format: str = "pdf"):
    """导出检测报告"""
    try:
        # 从数据库查询检测记录
        detection_record = await DetectionRecord.get(ObjectId(detection_id))
        if not detection_record:
            raise HTTPException(status_code=404, detail="检测结果不存在")
        
        return {
            "success": True,
            "message": f"报告导出成功，格式: {format}",
            "download_url": f"/download/{detection_id}.{format}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
