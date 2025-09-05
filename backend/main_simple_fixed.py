from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import os
import uuid
import httpx
import base64
import asyncio
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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

async def upload_image_to_dify(file_path: str, user_id: str):
    """上传文件到Dify服务器"""
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
        
        # 准备文件上传
        with open(file_path, 'rb') as f:
            files = {
                "file": (os.path.basename(file_path), f, mime_type)
            }
            data = {"user": user_id}
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    DIFY_FILE_URL,
                    headers={"Authorization": f"Bearer {DIFY_API_TOKEN}"},
                    files=files,
                    data=data
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
        import re
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

def process_dify_response(dify_data):
    """处理Dify响应数据，确保格式符合前端期望"""
    logger.info("开始处理Dify响应数据")
    
    try:
        # 提取outputs数据
        outputs = {}
        metadata = {}
        
        # 从不同可能的字段中提取数据
        if isinstance(dify_data, dict):
            # 提取输出数据
            if 'data' in dify_data and 'outputs' in dify_data['data']:
                outputs = dify_data['data']['outputs']
            elif 'outputs' in dify_data:
                outputs = dify_data['outputs']
            elif 'data' in dify_data:
                outputs = dify_data['data']
            else:
                outputs = dify_data
            
            # 提取元数据
            if 'data' in dify_data and 'metadata' in dify_data['data']:
                metadata = dify_data['data']['metadata']
            elif 'metadata' in dify_data:
                metadata = dify_data['metadata']
        
        logger.info(f"提取的outputs: {outputs}")
        logger.info(f"提取的metadata: {metadata}")
        
        # 查找文本内容
        text_content = None
        possible_text_fields = ['text', 'result', 'output', 'content', 'answer', 'response']
        
        for field in possible_text_fields:
            if field in outputs and isinstance(outputs[field], str):
                text_content = outputs[field]
                logger.info(f"找到文本内容在字段: {field}")
                break
        
        if text_content:
            # 分离JSON和Markdown内容
            separated_data = separate_json_and_markdown(text_content)
            
            # 更新outputs，添加分离后的数据
            outputs['json_data'] = separated_data['json_data']
            outputs['markdown_content'] = separated_data['markdown_content']
            
            # 保留原始文本
            if 'text' not in outputs:
                outputs['text'] = text_content
        
        # 构建符合前端期望的结构
        processed_result = {
            "outputs": outputs,
            "metadata": metadata
        }
        
        logger.info("Dify响应数据处理完成")
        return processed_result
        
    except Exception as e:
        logger.error(f"处理Dify响应数据时发生错误: {e}")
        import traceback
        logger.error(f"堆栈跟踪: {traceback.format_exc()}")
        
        # 返回原始数据作为fallback
        return {
            "outputs": dify_data if isinstance(dify_data, dict) else {"raw_data": dify_data},
            "metadata": {}
        }

async def call_dify_workflow(image_file_path: str, food_type: str, package_food_type: str, single_or_multi: str, package_size: str, max_retries: int = 2):
    """调用Dify Workflow API进行食品标签检测，带重试机制"""
    
    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                logger.info(f"第 {attempt + 1} 次尝试调用Dify API...")
                await asyncio.sleep(2 ** attempt)  # 指数退避
            
            logger.info("=" * 60)
            logger.info(f"开始调用Dify Workflow API (尝试 {attempt + 1}/{max_retries + 1})")
            logger.info(f"图片文件路径: {image_file_path}")
            logger.info(f"食品类型: {food_type}")
            logger.info(f"包装食品类型: {package_food_type}")
            logger.info(f"单包装或多包装: {single_or_multi}")
            logger.info(f"包装尺寸: {package_size}")
            logger.info(f"Dify API URL: {DIFY_API_URL}")
            logger.info(f"Dify API Token: {DIFY_API_TOKEN[:20]}...")
            
            # 检查文件路径类型，决定使用本地文件还是远程URL
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
                user_id = f"user-{uuid.uuid4().hex[:8]}"
                file_info = await upload_image_to_dify(image_file_path, user_id)
                
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
                "response_mode": "blocking",
                "user": f"user-{uuid.uuid4().hex[:8]}"
            }
            
            logger.info("请求载荷:")
            logger.info(json.dumps(payload, indent=2, ensure_ascii=False))
            
            # 发送请求到Dify API
            logger.info("开始发送HTTP请求到Dify API...")
            
            # 配置更健壮的HTTP客户端
            timeout = httpx.Timeout(
                connect=30.0,  # 连接超时
                read=300.0,    # 读取超时
                write=30.0,    # 写入超时
                pool=30.0      # 连接池超时
            )
            
            # 配置重试机制的限制
            limits = httpx.Limits(
                max_keepalive_connections=5,
                max_connections=10,
                keepalive_expiry=30.0
            )
            
            async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
                logger.info("发送POST请求...")
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
                    try:
                        # 尝试解析JSON响应
                        logger.info("开始解析JSON响应...")
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
                    except Exception as json_error:
                        logger.error(f"JSON解析失败: {str(json_error)}")
                        logger.error(f"原始响应内容: {response.text[:1000]}...")
                        return {
                            "success": False,
                            "error": f"响应解析失败: {str(json_error)}",
                            "message": "响应格式错误",
                            "raw_response": response.text[:500]
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
                    
        except httpx.ReadError as e:
            logger.error(f"读取响应时发生错误: {str(e)}")
            logger.error("这通常表示Dify服务器处理完成但在传输响应时连接中断")
            logger.error("可能的原因:")
            logger.error("1. 响应数据量过大")
            logger.error("2. 服务器处理时间过长")
            logger.error("3. 网络连接不稳定")
            logger.info("虽然出现ReadError，但Dify服务器可能已经成功处理了请求")
            
            if attempt < max_retries:
                logger.info(f"将在 {2 ** (attempt + 1)} 秒后重试...")
                continue
            else:
                logger.error("已达到最大重试次数，放弃重试")
                logger.info("=" * 60)
                return {
                    "success": False,
                    "error": f"读取响应失败: {str(e)}",
                    "message": "响应读取中断，但Dify服务器可能已处理完成",
                    "suggestion": "请检查Dify服务器日志确认处理状态",
                    "attempts": attempt + 1
                }
        except httpx.ConnectError as e:
            logger.error(f"连接错误: {str(e)}")
            logger.error("可能的原因:")
            logger.error("1. Dify服务器无法访问")
            logger.error("2. 网络连接问题") 
            logger.error("3. URL地址错误")
            
            if attempt < max_retries:
                logger.info(f"连接失败，将在 {2 ** (attempt + 1)} 秒后重试...")
                continue
            else:
                logger.error("已达到最大重试次数，放弃重试")
                logger.info("=" * 60)
                return {
                    "success": False,
                    "error": f"连接Dify服务器失败: {str(e)}",
                    "message": "无法连接到Dify服务器",
                    "attempts": attempt + 1
                }
        except httpx.TimeoutException as e:
            logger.error(f"请求超时: {str(e)}")
            logger.error("超时类型可能包括:")
            logger.error("1. 连接超时 - 无法建立连接")
            logger.error("2. 读取超时 - 等待响应超时")
            logger.error("3. 写入超时 - 发送数据超时")
            
            if attempt < max_retries:
                logger.info(f"请求超时，将在 {2 ** (attempt + 1)} 秒后重试...")
                continue
            else:
                logger.error("已达到最大重试次数，放弃重试")
                logger.info("=" * 60)
                return {
                    "success": False,
                    "error": f"请求超时: {str(e)}",
                    "message": "请求超时",
                    "attempts": attempt + 1
                }
        except Exception as e:
            logger.error(f"发生未预期异常: {str(e)}")
            logger.error(f"异常类型: {type(e).__name__}")
            import traceback
            logger.error(f"堆栈跟踪:\n{traceback.format_exc()}")
            
            if attempt < max_retries:
                logger.info(f"发生异常，将在 {2 ** (attempt + 1)} 秒后重试...")
                continue
            else:
                logger.error("已达到最大重试次数，放弃重试")
                logger.info("=" * 60)
                return {
                    "success": False,
                    "error": str(e),
                    "message": "检测过程中发生错误",
                    "attempts": attempt + 1
                }
    
    # 如果所有重试都失败了（理论上不应该到这里）
    return {
        "success": False,
        "error": "所有重试尝试都失败",
        "message": "检测失败",
        "attempts": max_retries + 1
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
        async with httpx.AsyncClient(timeout=300.0) as client:
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
            
            try:
                response_json = response.json()
                logger.info(f"测试响应返回: {response_json}")
            except Exception as json_error:
                logger.warning(f"无法解析响应JSON: {json_error}")
                response_json = "无法解析为JSON"
            
            result = {
                "success": True,
                "dify_url": DIFY_API_URL,
                "status_code": response.status_code,
                "response_headers": dict(response.headers),
                "response_text": response.text[:500] + "..." if len(response.text) > 500 else response.text,
                "message": "Dify API连接测试完成"
            }
            
            result["response_json"] = response_json
            return result
            
    except httpx.ReadError as e:
        logger.error(f"测试时读取响应失败: {str(e)}")
        return {
            "success": False,
            "error": f"读取响应失败: {str(e)}",
            "dify_url": DIFY_API_URL,
            "message": "响应读取中断，但服务器可能已处理请求"
        }
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
        
        # 处理Dify返回的数据，确保格式符合前端期望
        processed_dify_result = process_dify_response(dify_data)
        
        # 构建符合前端期望的响应结构
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
            "dify_result": processed_dify_result,
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
