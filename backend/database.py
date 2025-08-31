import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
try:
    from .models import DetectionRecord, UploadedFile, User, DetectionHistory
except ImportError:
    try:
        from models import DetectionRecord, UploadedFile, User, DetectionHistory
    except ImportError:
        from backend.models import DetectionRecord, UploadedFile, User, DetectionHistory


class Database:
    """数据库连接管理类"""
    
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.database_name: str = None
    
    async def connect(self):
        """连接到MongoDB数据库"""
        try:
            # 从环境变量获取数据库配置
            mongodb_host = os.getenv("MONGODB_HOST", "localhost")
            mongodb_port = int(os.getenv("MONGODB_PORT", "27017"))
            mongodb_username = os.getenv("MONGODB_USERNAME", "")
            mongodb_password = os.getenv("MONGODB_PASSWORD", "")
            self.database_name = os.getenv("MONGODB_DATABASE", "food_safety")
            
            # 构建连接字符串
            if mongodb_username and mongodb_password:
                connection_string = f"mongodb://{mongodb_username}:{mongodb_password}@{mongodb_host}:{mongodb_port}/{self.database_name}?authSource=admin"
            else:
                connection_string = f"mongodb://{mongodb_host}:{mongodb_port}/{self.database_name}"
            
            print(f"🔗 连接到MongoDB: {mongodb_host}:{mongodb_port}/{self.database_name}")
            
            # 创建客户端连接
            self.client = AsyncIOMotorClient(connection_string)
            
            # 初始化Beanie ODM
            await init_beanie(
                database=self.client[self.database_name],
                document_models=[
                    DetectionRecord,
                    UploadedFile,
                    User,
                    DetectionHistory
                ]
            )
            
            print("✅ MongoDB连接成功")
            
        except Exception as e:
            print(f"❌ MongoDB连接失败: {str(e)}")
            raise e
    
    async def disconnect(self):
        """断开数据库连接"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB连接已断开")
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            if self.client:
                # 执行简单的数据库操作来检查连接
                await self.client.admin.command('ping')
                return True
            return False
        except Exception as e:
            print(f"❌ 数据库健康检查失败: {str(e)}")
            return False
    
    async def get_database_info(self) -> dict:
        """获取数据库信息"""
        try:
            if self.client:
                db = self.client[self.database_name]
                stats = await db.command("dbStats")
                return {
                    "database_name": self.database_name,
                    "collections": stats.get("collections", 0),
                    "data_size": stats.get("dataSize", 0),
                    "storage_size": stats.get("storageSize", 0),
                    "indexes": stats.get("indexes", 0),
                    "index_size": stats.get("indexSize", 0)
                }
            return {}
        except Exception as e:
            print(f"❌ 获取数据库信息失败: {str(e)}")
            return {}


# 创建全局数据库实例
database = Database()


async def get_database() -> Database:
    """获取数据库实例"""
    return database


async def init_database():
    """初始化数据库"""
    await database.connect()
    
    # 创建索引
    try:
        await DetectionRecord.get_motor_collection().create_index("product_name")
        await DetectionRecord.get_motor_collection().create_index("detection_time")
        await DetectionRecord.get_motor_collection().create_index("overall_rating")
        
        await UploadedFile.get_motor_collection().create_index("detection_id")
        await UploadedFile.get_motor_collection().create_index("uploaded_at")
        
        await User.get_motor_collection().create_index("username", unique=True)
        await User.get_motor_collection().create_index("email", unique=True)
        
        await DetectionHistory.get_motor_collection().create_index("detection_time")
        await DetectionHistory.get_motor_collection().create_index("overall_rating")
        
        print("✅ 数据库索引创建成功")
    except Exception as e:
        print(f"⚠️ 创建索引时出现警告: {str(e)}")


async def close_database():
    """关闭数据库连接"""
    await database.disconnect()
