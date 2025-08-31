#!/usr/bin/env python3
"""
MongoDB 连接测试脚本
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB 连接配置
MONGODB_HOST = "114.215.204.62"
MONGODB_PORT = 27017
MONGODB_USERNAME = "jfj"
MONGODB_PASSWORD = "123abc"
MONGODB_DATABASE = "food_safety"

async def test_mongodb_connection():
    """测试MongoDB连接"""
    try:
        print("🔗 正在连接MongoDB...")
        
        # 构建连接字符串
        connection_string = f"mongodb://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@{MONGODB_HOST}:{MONGODB_PORT}/{MONGODB_DATABASE}?authSource=admin"
        
        # 创建客户端连接
        client = AsyncIOMotorClient(connection_string)
        
        # 测试连接
        await client.admin.command('ping')
        print("✅ MongoDB连接成功!")
        
        # 获取数据库信息
        db = client[MONGODB_DATABASE]
        stats = await db.command("dbStats")
        
        print(f"📊 数据库信息:")
        print(f"   数据库名: {MONGODB_DATABASE}")
        print(f"   集合数量: {stats.get('collections', 0)}")
        print(f"   数据大小: {stats.get('dataSize', 0)} bytes")
        print(f"   存储大小: {stats.get('storageSize', 0)} bytes")
        print(f"   索引数量: {stats.get('indexes', 0)}")
        print(f"   索引大小: {stats.get('indexSize', 0)} bytes")
        
        # 测试集合操作
        print("\n🧪 测试集合操作...")
        
        # 检查集合是否存在
        collections = await db.list_collection_names()
        print(f"   现有集合: {collections}")
        
        # 测试插入文档
        test_doc = {
            "test": True,
            "message": "MongoDB连接测试",
            "timestamp": datetime.now(),
            "version": "1.0.0"
        }
        
        result = await db.test_collection.insert_one(test_doc)
        print(f"   插入测试文档: {result.inserted_id}")
        
        # 测试查询文档
        doc = await db.test_collection.find_one({"_id": result.inserted_id})
        print(f"   查询测试文档: {doc is not None}")
        
        # 清理测试数据
        await db.test_collection.delete_one({"_id": result.inserted_id})
        print("   清理测试数据完成")
        
        # 关闭连接
        client.close()
        print("🔌 MongoDB连接已关闭")
        
        return True
        
    except Exception as e:
        print(f"❌ MongoDB连接失败: {str(e)}")
        return False

async def test_collections():
    """测试集合创建和索引"""
    try:
        print("\n📋 测试集合和索引创建...")
        
        connection_string = f"mongodb://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@{MONGODB_HOST}:{MONGODB_PORT}/{MONGODB_DATABASE}?authSource=admin"
        client = AsyncIOMotorClient(connection_string)
        db = client[MONGODB_DATABASE]
        
        # 创建测试集合
        collections = ["detection_records", "uploaded_files", "users", "detection_history"]
        
        for collection_name in collections:
            # 创建集合
            await db.create_collection(collection_name)
            print(f"   ✅ 创建集合: {collection_name}")
            
            # 创建索引
            collection = db[collection_name]
            
            if collection_name == "detection_records":
                await collection.create_index("product_name")
                await collection.create_index("detection_time")
                await collection.create_index("overall_rating")
                print(f"   🔍 创建索引: {collection_name}")
            
            elif collection_name == "uploaded_files":
                await collection.create_index("detection_id")
                await collection.create_index("uploaded_at")
                print(f"   🔍 创建索引: {collection_name}")
            
            elif collection_name == "users":
                await collection.create_index("username", unique=True)
                await collection.create_index("email", unique=True)
                print(f"   🔍 创建索引: {collection_name}")
            
            elif collection_name == "detection_history":
                await collection.create_index("detection_time")
                await collection.create_index("overall_rating")
                print(f"   🔍 创建索引: {collection_name}")
        
        # 验证集合
        existing_collections = await db.list_collection_names()
        print(f"\n📊 现有集合: {existing_collections}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ 集合测试失败: {str(e)}")
        return False

async def main():
    """主函数"""
    print("🚀 MongoDB 连接测试开始...")
    print(f"📍 连接地址: {MONGODB_HOST}:{MONGODB_PORT}")
    print(f"👤 用户名: {MONGODB_USERNAME}")
    print(f"🗄️  数据库: {MONGODB_DATABASE}")
    print("-" * 50)
    
    # 测试连接
    connection_success = await test_mongodb_connection()
    
    if connection_success:
        # 测试集合
        await test_collections()
        
        print("\n🎉 所有测试完成!")
        print("✅ MongoDB配置正确，可以正常使用")
    else:
        print("\n❌ 测试失败，请检查MongoDB配置")

if __name__ == "__main__":
    asyncio.run(main())
