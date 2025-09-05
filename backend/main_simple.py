from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import os
import uuid
import asyncio
import logging
import requests
import re
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

def separate_json_and_markdown(text_content):
    """分离JSON和Markdown内容"""
    logger.info("开始分离JSON和Markdown内容")
    
    if not text_content or not isinstance(text_content, str):
        logger.warning("输入内容为空或不是字符串")
        return {
            "json_data": None,
            "markdown_content": text_content or ""
        }
    
    try:
        # 方法1: 查找「不规范内容总结报告」的位置
        report_index = text_content.find('不规范内容总结报告')
        if report_index != -1:
            logger.info(f"找到「不规范内容总结报告」位置: {report_index}")
            
            # 分离JSON和Markdown
            json_part = text_content[:report_index].strip()
            markdown_part = text_content[report_index:].strip()
            
            # 尝试解析JSON部分
            try:
                json_data = json.loads(json_part)
                logger.info("成功解析JSON部分")
                return {
                    "json_data": json_data,
                    "markdown_content": markdown_part
                }
            except json.JSONDecodeError as e:
                logger.warning(f"JSON解析失败: {e}")
        
        # 方法2: 使用正则表达式提取最大的JSON对象
        logger.info("尝试使用正则表达式提取JSON")
        json_match = re.search(r'\{.*\}', text_content, re.DOTALL)
        if json_match:
            json_candidate = json_match.group(0)
            try:
                json_data = json.loads(json_candidate)
                logger.info("成功通过正则表达式解析JSON")
                
                # 提取Markdown部分（JSON之后的内容）
                markdown_start = json_match.end()
                markdown_content = text_content[markdown_start:].strip()
                
                return {
                    "json_data": json_data,
                    "markdown_content": markdown_content
                }
            except json.JSONDecodeError as e:
                logger.warning(f"正则表达式提取的JSON解析失败: {e}")
        
        # 方法3: 如果都失败，返回原始内容作为Markdown
        logger.warning("无法分离JSON和Markdown，返回原始内容")
        return {
            "json_data": None,
            "markdown_content": text_content
        }
        
    except Exception as e:
        logger.error(f"分离JSON和Markdown时发生错误: {e}")
        return {
            "json_data": None,
            "markdown_content": text_content
        }

# Dify API配置
DIFY_API_URL = "http://114.215.204.62/v1/workflows/run"
DIFY_FILE_URL = "http://114.215.204.62/v1/files/upload"
DIFY_API_TOKEN = "app-xBO6kaetqL7HF0avy1cSZMTR"

app = FastAPI(
    title="食品安全标签检测系统API - MVP版本",
    description="简化版食品标签合规性检测系统",
    version="1.0.0-mvp"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def upload_image(file_path, user):
    """上传文件到Dify服务器"""
    headers = {
        "Content-Type": "multipart/form-data",
        "Authorization": f"Bearer {DIFY_API_TOKEN}",
    }
    
    try:
        logger.info(f"开始上传文件到Dify: {file_path}")
        
        # 根据文件扩展名确定MIME类型
        file_ext = os.path.splitext(file_path)[1].lower()
        mime_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf'
        }
        mime_type = mime_type_map.get(file_ext, 'image/jpeg')
        
        files = {"file": (
            os.path.basename(file_path), 
            open(file_path, 'rb'), 
            mime_type)
        }
        data = {"user": user}
        headers = {"Authorization": f"Bearer {DIFY_API_TOKEN}"}
        logger.info("files: %s", files)
        logger.info("data: %s", data)
        logger.info("headers: %s", headers)
        # 简单的requests.post请求，不使用重试
        response = requests.post(
            DIFY_FILE_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=(30, 180)  # (连接超时, 读取超时)
        )
        logger.info(f"Dify文件上传响应状态码: {response.status_code}")
        logger.info(f"Dify文件上传响应内容: {response.text}")
        
        if response.status_code == 201:  # 201 表示创建成功
            file_info = response.json()
            logger.info(f"文件上传成功，文件ID: {file_info.get('id')}")
            return file_info
        else:
            logger.error(f"文件上传失败，状态码: {response.status_code}")
            logger.error(f"错误内容: {response.text}")
            return None
    except Exception as e:
        logger.error(f"上传文件时发生错误: {str(e)}")
        import traceback
        logger.error(f"堆栈跟踪: {traceback.format_exc()}")
        return None

def parse_streaming_response(response):
    """解析Dify流式响应"""
    logger.info("开始解析Server-Sent Events (SSE)流式响应")
    
    # 用于存储解析结果
    workflow_data = {
        "task_id": None,
        "workflow_run_id": None,
        "workflow_id": None,
        "status": None,
        "outputs": {},
        "total_tokens": 0,
        "total_price": 0.0,
        "currency": "USD",
        "elapsed_time": 0.0,
        "total_steps": 0,
        "created_at": None,
        "finished_at": None,
        "events": []  # 存储所有事件
    }
    
    try:
        # 逐行读取流式响应
        for line in response.iter_lines(decode_unicode=True):
            if not line or line.strip() == "":
                continue
                
            logger.debug(f"收到SSE行: {line}")
            
            # SSE格式：data: {json}
            if line.startswith("data: "):
                try:
                    json_str = line[6:]  # 去掉"data: "前缀
                    event_data = json.loads(json_str)
                    
                    event_type = event_data.get("event")
                    data = event_data.get("data", {})
                    
                    logger.info(f"处理事件: {event_type}")
                    workflow_data["events"].append(event_data)
                    
                    # 根据事件类型处理
                    if event_type == "workflow_started":
                        workflow_data["task_id"] = event_data.get("task_id")
                        workflow_data["workflow_run_id"] = event_data.get("workflow_run_id")
                        workflow_data["workflow_id"] = data.get("workflow_id")
                        workflow_data["created_at"] = data.get("created_at")
                        logger.info(f"工作流开始: {workflow_data['task_id']}")
                        
                    elif event_type == "node_started":
                        node_id = data.get("node_id")
                        node_type = data.get("node_type")
                        title = data.get("title")
                        logger.info(f"节点开始: {title} ({node_type})")
                        
                    elif event_type == "node_finished":
                        node_id = data.get("node_id")
                        node_type = data.get("node_type") 
                        title = data.get("title")
                        status = data.get("status")
                        elapsed_time = data.get("elapsed_time", 0)
                        
                        # 累计执行时间
                        workflow_data["elapsed_time"] += elapsed_time
                        
                        # 提取执行元数据
                        metadata = data.get("execution_metadata", {})
                        if metadata:
                            workflow_data["total_tokens"] += metadata.get("total_tokens", 0)
                            # 确保total_price是数字类型
                            price = metadata.get("total_price", 0.0)
                            if isinstance(price, str):
                                try:
                                    price = float(price)
                                except (ValueError, TypeError):
                                    price = 0.0
                            workflow_data["total_price"] += price
                            workflow_data["currency"] = metadata.get("currency", "USD")
                        
                        # 提取输出数据
                        outputs = data.get("outputs", {})
                        if outputs:
                            workflow_data["outputs"].update(outputs)
                            logger.info(f"节点输出: {json.dumps(outputs, ensure_ascii=False)}")
                            
                        logger.info(f"节点完成: {title} ({status}) - {elapsed_time}s")
                        
                    elif event_type == "workflow_finished":
                        workflow_data["status"] = data.get("status")
                        workflow_data["finished_at"] = data.get("finished_at")
                        workflow_data["total_steps"] = data.get("total_steps", 0)
                        
                        # 最终输出
                        final_outputs = data.get("outputs", {})
                        if final_outputs:
                            workflow_data["outputs"].update(final_outputs)
                            logger.info(f"最终输出: {json.dumps(final_outputs, ensure_ascii=False)}")
                            
                            # 处理text字段，分离JSON和Markdown
                            if "text" in final_outputs:
                                text_content = final_outputs["text"]
                                logger.info("开始处理text字段，分离JSON和Markdown")
                                
                                separated_data = separate_json_and_markdown(text_content)
                                
                                # 更新outputs，添加分离后的数据
                                workflow_data["outputs"]["json_data"] = separated_data["json_data"]
                                workflow_data["outputs"]["markdown_content"] = separated_data["markdown_content"]
                                
                                logger.info("JSON和Markdown分离完成")
                                if separated_data["json_data"]:
                                    logger.info(f"JSON数据包含字段: {list(separated_data['json_data'].keys())}")
                                if separated_data["markdown_content"]:
                                    logger.info(f"Markdown内容长度: {len(separated_data['markdown_content'])}")
                            
                        # 最终统计
                        final_tokens = data.get("total_tokens")
                        if final_tokens:
                            workflow_data["total_tokens"] = final_tokens
                            
                        logger.info(f"工作流完成: {workflow_data['status']}")
                        logger.info(f"总用时: {workflow_data['elapsed_time']}s")
                        logger.info(f"总令牌: {workflow_data['total_tokens']}")
                        
                    elif event_type == "tts_message":
                        # TTS消息处理（如果需要）
                        logger.debug("收到TTS消息")
                        
                    elif event_type == "tts_message_end":
                        # TTS消息结束
                        logger.debug("TTS消息结束")
                        
                    else:
                        logger.warning(f"未处理的事件类型: {event_type}")
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"JSON解析失败: {json_str} - {e}")
                    continue
                except Exception as e:
                    logger.error(f"处理事件数据失败: {e}")
                    continue
        
        # 检查是否成功完成
        if workflow_data["status"] == "succeeded":
            logger.info("流式响应解析成功!")
            return {
                "success": True,
                "data": {
                    "workflow_run_id": workflow_data["workflow_run_id"],
                    "task_id": workflow_data["task_id"],
                    "status": workflow_data["status"],
                    "outputs": workflow_data["outputs"],
                    "metadata": {
                        "total_tokens": workflow_data["total_tokens"],
                        "total_price": workflow_data["total_price"],
                        "currency": workflow_data["currency"],
                        "elapsed_time": workflow_data["elapsed_time"],
                        "total_steps": workflow_data["total_steps"]
                    },
                    "created_at": workflow_data["created_at"],
                    "finished_at": workflow_data["finished_at"],
                    "event_count": len(workflow_data["events"])
                }
            }
        elif workflow_data["status"] == "failed":
            logger.error("工作流执行失败")
            return {
                "success": False,
                "error": "工作流执行失败",
                "data": workflow_data
            }
        else:
            logger.warning(f"工作流状态异常: {workflow_data['status']}")
            return {
                "success": False,
                "error": f"工作流状态异常: {workflow_data['status']}",
                "data": workflow_data
            }
            
    except Exception as e:
        logger.error(f"流式响应解析异常: {str(e)}")
        import traceback
        logger.error(f"堆栈跟踪: {traceback.format_exc()}")
        return {
            "success": False,
            "error": f"流式响应解析异常: {str(e)}",
            "data": workflow_data
        }

def call_dify_workflow(image_file_path: str, food_type: str, package_food_type: str, single_or_multi: str, package_size: str):
    """调用Dify Workflow API进行食品标签检测"""
    
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    
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
            # 本地文件，先上传到Dify服务器，然后使用文件ID
            logger.info("使用Dify文件上传方式处理图片")
            file_info = upload_image(image_file_path, user=user_id)
            
            if file_info and file_info.get('id'):
                # 使用上传后的文件ID
                tag_image = {
                    "type": "image",
                    "transfer_method": "local_file", 
                    "upload_file_id": file_info['id']
                }
                logger.info(f"使用Dify文件ID: {file_info['id']}")
            else:
                raise Exception(f"图片上传Dify服务器失败，请检查")
        
        # 构建请求数据
        payload = {
            "inputs": {
                "TagImage": [tag_image],
                "Foodtype": food_type,
                "PackageFoodType": package_food_type,
                "SingleOrMulti": single_or_multi,
                "PackageSize": package_size
            },
            "response_mode": "streaming",
            "user": user_id
        }
        
        logger.info("请求载荷:")
        logger.info(json.dumps(payload, indent=2, ensure_ascii=False))
        
        # 发送请求到Dify API
        logger.info("开始发送HTTP请求到Dify API...")
        logger.info("发送POST请求...")
        
        # 发送流式请求
        response = requests.post(
            DIFY_API_URL,
            headers={
                "Authorization": f"Bearer {DIFY_API_TOKEN}",
                "Content-Type": "application/json",
                "User-Agent": "Food-Safety-Label-Detection/1.0"
            },
            json=payload,
            timeout=(30, 300),  # (连接超时, 读取超时)
            stream=True  # 启用流式响应
        )
        
        logger.info(f"HTTP响应状态码: {response.status_code}")
        logger.info(f"HTTP响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                # 解析流式响应
                logger.info("开始解析流式响应...")
                result = parse_streaming_response(response)
                
                if result["success"]:
                    logger.info("Dify API流式调用成功!")
                    logger.info("最终结果:")
                    logger.info(json.dumps(result["data"], indent=2, ensure_ascii=False))
                    logger.info("=" * 60)
                    return {
                        "success": True,
                        "data": result["data"],
                        "message": "Dify Workflow调用成功"
                    }
                else:
                    logger.error(f"流式响应处理失败: {result['error']}")
                    return result
                    
            except Exception as stream_error:
                logger.error(f"流式响应解析失败: {str(stream_error)}")
                import traceback
                logger.error(f"堆栈跟踪: {traceback.format_exc()}")
                return {
                    "success": False,
                    "error": f"流式响应解析失败: {str(stream_error)}",
                    "message": "响应格式错误"
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
            
    except requests.exceptions.ReadTimeout as e:
        logger.error(f"读取响应超时: {str(e)}")
        logger.error("Dify服务器处理时间过长")
        logger.info("=" * 60)
        return {
            "success": False,
            "error": f"读取响应超时: {str(e)}",
            "message": "响应超时"
        }
    except requests.exceptions.ConnectionError as e:
        logger.error(f"连接错误: {str(e)}")
        
        # 特别处理Connection reset by peer错误
        if "Connection reset by peer" in str(e) or "ConnectionResetError" in str(e):
            logger.error("检测到Connection reset by peer错误")
            logger.error("Dify服务器主动断开连接")
        else:
            logger.error("无法连接到Dify服务器")
        
        logger.info("=" * 60)
        return {
            "success": False,
            "error": f"连接Dify服务器失败: {str(e)}",
            "message": "无法连接到Dify服务器"
        }
    except requests.exceptions.Timeout as e:
        logger.error(f"请求超时: {str(e)}")
        logger.info("=" * 60)
        return {
            "success": False,
            "error": f"请求超时: {str(e)}",
            "message": "请求超时"
        }
    except Exception as e:
        logger.error(f"发生未预期异常: {str(e)}")
        logger.error(f"异常类型: {type(e).__name__}")
        import traceback
        logger.error(f"堆栈跟踪:\n{traceback.format_exc()}")
        logger.info("=" * 60)
        return {
            "success": False,
            "error": str(e),
            "message": "检测过程中发生错误"
        }

@app.get("/")
async def root():
    return {"message": "食品安全标签检测系统API - MVP版本", "version": "1.0.0-mvp"}

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "mvp"
    }

@app.get("/api/test-dify")
def test_dify_connection():
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
                        "dify_model_identity": "__dify__file__",
                        "id": None,
                        "tenant_id": "75909248-8efe-4f8b-9985-4aa63313abf2",
                        "type": "image",
                        "transfer_method": "remote_url",
                        "remote_url": "https://26867860.s21i.faiusr.com/2/ABUIABACGAAg4oLkhwYo6PjfngcwlgY41wo.jpg",
                        "related_id": None,
                        "filename": "ABUIABACGAAg4oLkhwYo6PjfngcwlgY41wo.jpg",
                        "extension": ".jpg",
                        "mime_type": "image/jpeg",
                        "size": 316362,
                        "url": "https://26867860.s21i.faiusr.com/2/ABUIABACGAAg4oLkhwYo6PjfngcwlgY41wo.jpg"
                    }
                ],
                "Foodtype": "糕点",
                "PackageFoodType": "直接提供给消费者的预包装食品",
                "SingleOrMulti": "多件",
                "PackageSize": "最大表面面积大于35cm2"
            },
            "response_mode": "blocking",
            "user": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        logger.info("发送测试请求到Dify API...")
        
        # 流式请求测试
        response = requests.post(
            DIFY_API_URL,
            headers={
                "Authorization": f"Bearer {DIFY_API_TOKEN}",
                "Content-Type": "application/json",
                "User-Agent": "Food-Safety-Label-Detection/1.0"
            },
            json=test_payload,
            timeout=(30, 180),  # (连接超时, 读取超时)
            stream=True  # 启用流式响应
        )

        logger.info(f"测试响应状态码: {response.status_code}")
        logger.info(f"测试响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            # 尝试解析流式响应
            try:
                logger.info("测试流式响应解析...")
                stream_result = parse_streaming_response(response)
                
                result = {
                    "success": True,
                    "dify_url": DIFY_API_URL,
                    "status_code": response.status_code,
                    "response_headers": dict(response.headers),
                    "message": "Dify API流式连接测试完成",
                    "stream_parsing": stream_result["success"],
                    "stream_data": stream_result.get("data", {})
                }
                
                if stream_result["success"]:
                    logger.info("流式响应测试成功!")
                else:
                    logger.warning(f"流式响应解析失败: {stream_result.get('error')}")
                    
                return result
                
            except Exception as stream_error:
                logger.error(f"流式响应测试失败: {stream_error}")
                return {
                    "success": False,
                    "dify_url": DIFY_API_URL,
                    "status_code": response.status_code,
                    "error": f"流式响应测试失败: {stream_error}",
                    "message": "流式响应测试异常"
                }
        else:
            # 非200状态码
            try:
                error_text = response.text
            except:
                error_text = "无法读取响应内容"
                
            return {
                "success": False,
                "dify_url": DIFY_API_URL,
                "status_code": response.status_code,
                "response_headers": dict(response.headers),
                "error_text": error_text[:500],
                "message": f"Dify API返回错误状态码: {response.status_code}"
            }
        
    except requests.exceptions.Timeout as e:
        logger.error(f"测试时请求超时: {str(e)}")
        return {
            "success": False,
            "error": f"请求超时: {str(e)}",
            "dify_url": DIFY_API_URL,
            "message": "请求超时"
        }
    except requests.exceptions.ConnectionError as e:
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

@app.post("/api/detect")
async def detect_label(
    file: UploadFile = File(...),
    Foodtype: str = Form(...),
    PackageFoodType: str = Form(...),
    SingleOrMulti: str = Form(...),
    PackageSize: str = Form(...),
    DetectionTime: str = Form(...),
    SpecialRequirement: Optional[str] = Form(None)
):
    """简化版标签检测接口 - 直接调用Dify API返回结果"""
    try:
        logger.info("=" * 80)
        logger.info("收到新的检测请求 /api/detect")
        logger.info(f"文件名: {file.filename}")
        logger.info(f"文件类型: {file.content_type}")
        logger.info(f"文件大小: {file.size}")
        logger.info(f"食品类型: {Foodtype}")
        logger.info(f"包装食品类型: {PackageFoodType}")
        logger.info(f"单包装或多包装: {SingleOrMulti}")
        logger.info(f"包装尺寸: {PackageSize}")
        logger.info(f"检测时间: {DetectionTime}")
        logger.info(f"特殊要求: {SpecialRequirement}")
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
        dify_result = call_dify_workflow(
            image_file_path=file_path,
            food_type=Foodtype,
            package_food_type=PackageFoodType,
            single_or_multi=SingleOrMulti,
            package_size=PackageSize
        )
        logger.info(dify_result)
        logger.info(f"Dify API调用结果: success={dify_result['success']}")

        if not dify_result["success"]:
            logger.error(f"Dify API调用失败: {dify_result['error']}")
            # 即使失败也清理文件
            try:
                os.remove(file_path)
                logger.info(f"已清理临时文件: {file_path}")
            except:
                logger.warning(f"无法清理临时文件: {file_path}")
            raise HTTPException(status_code=500, detail=dify_result["error"])
        
        logger.info("Dify API调用成功，开始处理返回数据...")
        
        # 解析Dify返回的结果
        dify_data = dify_result["data"]
        logger.info(f"Dify返回数据类型: {type(dify_data)}")
        logger.info(f"Dify返回数据内容: {json.dumps(dify_data, indent=2, ensure_ascii=False) if isinstance(dify_data, dict) else str(dify_data)}")
        
        # 简单处理检测结果，直接返回Dify的原始数据
        result = {
            "success": True,
            "detection_time": DetectionTime,
            "file_info": {
                "filename": file.filename,
                "file_type": file.content_type,
                "file_size": file.size
            },
            "input_params": {
                "Foodtype": Foodtype,
                "PackageFoodType": PackageFoodType,
                "SingleOrMulti": SingleOrMulti,
                "PackageSize": PackageSize,
                "SpecialRequirement": SpecialRequirement
            },
            "dify_result": dify_data,
            "message": "检测完成"
        }
        
        logger.info("检测完成，准备返回结果")
        
        # 清理临时文件
        try:
            os.remove(file_path)
            logger.info(f"已清理临时文件: {file_path}")
        except:
            logger.warning(f"无法清理临时文件: {file_path}")
        
        return result
        
    except HTTPException:
        # 重新抛出HTTP异常，不修改
        raise
    except Exception as e:
        logger.error(f"检测过程中发生异常: {str(e)}")
        logger.error(f"异常类型: {type(e).__name__}")
        import traceback
        logger.error(f"完整堆栈跟踪:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"检测失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # 创建必要的目录
    os.makedirs("uploads", exist_ok=True)
    uvicorn.run(app, host="0.0.0.0", port=8000)
