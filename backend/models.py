from datetime import datetime
from typing import Optional, List, Dict, Any
from beanie import Document, Indexed
from pydantic import Field, ConfigDict
from bson import ObjectId


class DetectionRecord(Document):
    """检测记录模型"""
    
    class Settings:
        name = "detection_records"
        indexes = [
            "product_name",
            "product_type", 
            "detection_time",
            "overall_rating"
        ]
    
    # 基本信息
    product_name: str = Field(..., description="产品名称")
    product_type: str = Field(..., description="产品类型")
    package_size_category: str = Field(..., description="包装面积分类")
    detection_time: datetime = Field(default_factory=datetime.now, description="检测时间")
    
    # 合规性评估
    overall_rating: str = Field(..., description="总体评级")
    compliance_rate: float = Field(..., description="合规率")
    key_issues: int = Field(default=0, description="关键问题数量")
    general_issues: int = Field(default=0, description="一般问题数量")
    low_risk_issues: int = Field(default=0, description="低风险问题数量")
    
    # 详细结果
    detection_result: Dict[str, Any] = Field(..., description="详细检测结果")
    
    # 元数据
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "product_name": "稻香村月饼富贵佳礼盒（广式月饼）",
                "product_type": "直接消费者",
                "package_size_category": "常规包装（>35cm²）",
                "detection_time": "2024-12-28T00:00:00",
                "overall_rating": "基本合格",
                "compliance_rate": 75.0,
                "key_issues": 2,
                "general_issues": 3,
                "low_risk_issues": 0,
                "detection_result": {
                    "基本信息": {},
                    "合规性评估": {},
                    "详细检测结果": []
                }
            }
        }
    )


class UploadedFile(Document):
    """上传文件记录模型"""
    
    class Settings:
        name = "uploaded_files"
        indexes = [
            "detection_id",
            "file_type",
            "uploaded_at"
        ]
    
    filename: str = Field(..., description="文件名")
    original_filename: str = Field(..., description="原始文件名")
    file_path: str = Field(..., description="文件路径")
    file_size: int = Field(..., description="文件大小(字节)")
    file_type: str = Field(..., description="文件类型")
    detection_id: Optional[ObjectId] = Field(None, description="关联的检测记录ID")
    uploaded_at: datetime = Field(default_factory=datetime.now, description="上传时间")
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "filename": "food_label_001.jpg",
                "original_filename": "食品标签.jpg",
                "file_path": "/app/uploads/food_label_001.jpg",
                "file_size": 1024000,
                "file_type": "image/jpeg",
                "detection_id": "507f1f77bcf86cd799439011"
            }
        }
    )


class User(Document):
    """用户模型"""
    
    class Settings:
        name = "users"
        indexes = [
            [("username", 1), {"unique": True}],
            [("email", 1), {"unique": True}]
        ]
    
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    password_hash: str = Field(..., description="密码哈希")
    full_name: Optional[str] = Field(None, description="全名")
    is_active: bool = Field(default=True, description="是否激活")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "username": "admin",
                "email": "admin@example.com",
                "password_hash": "hashed_password",
                "full_name": "管理员",
                "is_active": True
            }
        }
    )


class DetectionHistory(Document):
    """检测历史记录模型（用于快速查询）"""
    
    class Settings:
        name = "detection_history"
        indexes = [
            "product_name",
            "product_type",
            "detection_time",
            "overall_rating"
        ]
    
    detection_id: ObjectId = Field(..., description="检测记录ID")
    product_name: str = Field(..., description="产品名称")
    product_type: str = Field(..., description="产品类型")
    detection_time: datetime = Field(..., description="检测时间")
    overall_rating: str = Field(..., description="总体评级")
    compliance_rate: float = Field(..., description="合规率")
    issue_count: int = Field(..., description="问题总数")
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "detection_id": "507f1f77bcf86cd799439011",
                "product_name": "稻香村月饼富贵佳礼盒（广式月饼）",
                "product_type": "直接消费者",
                "detection_time": "2024-12-28T00:00:00",
                "overall_rating": "基本合格",
                "compliance_rate": 75.0,
                "issue_count": 4
            }
        }
    )
