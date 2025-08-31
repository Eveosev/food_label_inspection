#!/usr/bin/env python3
"""
测试Dify流式响应解析
"""

import json
import io
from backend.main_simple import parse_streaming_response

def create_mock_response():
    """创建模拟的流式响应"""
    
    # 模拟SSE流数据
    sse_data = [
        'data: {"event": "workflow_started", "task_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow_run_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "workflow_id": "dfjasklfjdslag", "created_at": 1679586595}}',
        '',
        'data: {"event": "node_started", "task_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow_run_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "node_id": "dfjasklfjdslag", "node_type": "start", "title": "Start", "index": 0, "predecessor_node_id": "fdljewklfklgejlglsd", "inputs": {}, "created_at": 1679586595}}',
        '',
        'data: {"event": "node_finished", "task_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow_run_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "node_id": "dfjasklfjdslag", "node_type": "start", "title": "Start", "index": 0, "predecessor_node_id": "fdljewklfklgejlglsd", "inputs": {}, "outputs": {"result": "检测完成"}, "status": "succeeded", "elapsed_time": 0.324, "execution_metadata": {"total_tokens": 63127864, "total_price": 2.378, "currency": "USD"}, "created_at": 1679586595}}',
        '',
        'data: {"event": "workflow_finished", "task_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow_run_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "workflow_id": "dfjasklfjdslag", "outputs": {"final_result": "食品标签检测完成", "compliance": "符合标准"}, "status": "succeeded", "elapsed_time": 0.324, "total_tokens": 63127864, "total_steps": "1", "created_at": 1679586595, "finished_at": 1679976595}}',
        ''
    ]
    
    # 创建模拟响应对象
    class MockResponse:
        def __init__(self, lines):
            self.lines = lines
            
        def iter_lines(self, decode_unicode=True):
            for line in self.lines:
                yield line
    
    return MockResponse(sse_data)

def test_streaming_parser():
    """测试流式响应解析器"""
    
    print("🧪 测试Dify流式响应解析器")
    print("=" * 50)
    
    # 创建模拟响应
    mock_response = create_mock_response()
    
    # 解析响应
    result = parse_streaming_response(mock_response)
    
    # 检查结果
    print("📊 解析结果:")
    print(f"成功: {result['success']}")
    
    if result["success"]:
        data = result["data"]
        print(f"任务ID: {data['task_id']}")
        print(f"工作流运行ID: {data['workflow_run_id']}")
        print(f"状态: {data['status']}")
        print(f"输出: {json.dumps(data['outputs'], indent=2, ensure_ascii=False)}")
        print(f"总令牌: {data['metadata']['total_tokens']}")
        print(f"总价格: ${data['metadata']['total_price']}")
        print(f"执行时间: {data['metadata']['elapsed_time']}秒")
        print(f"事件数量: {data['event_count']}")
        
        print("\n✅ 流式响应解析测试通过!")
    else:
        print(f"❌ 解析失败: {result['error']}")
        
    print("=" * 50)

def test_error_cases():
    """测试错误情况"""
    
    print("\n🧪 测试错误情况处理")
    print("=" * 50)
    
    # 测试无效JSON
    class MockErrorResponse:
        def iter_lines(self, decode_unicode=True):
            yield 'data: {"event": "workflow_started", invalid json'
            yield 'data: {"event": "workflow_finished", "data": {"status": "failed"}}'
    
    result = parse_streaming_response(MockErrorResponse())
    print(f"无效JSON处理: {'✅' if not result['success'] else '❌'}")
    
    # 测试失败工作流
    class MockFailedResponse:
        def iter_lines(self, decode_unicode=True):
            yield 'data: {"event": "workflow_started", "task_id": "test", "workflow_run_id": "test", "data": {}}'
            yield 'data: {"event": "workflow_finished", "data": {"status": "failed"}}'
    
    result = parse_streaming_response(MockFailedResponse())
    print(f"失败工作流处理: {'✅' if not result['success'] else '❌'}")
    
    print("=" * 50)

def demonstrate_integration():
    """演示集成使用"""
    
    print("\n💡 集成使用示例")
    print("=" * 50)
    
    print("1. 前端请求格式不变")
    print("2. 后端自动处理流式响应")
    print("3. 返回统一的JSON格式")
    print("4. 包含完整的执行元数据")
    
    print("\n📋 优势:")
    print("✅ 避免Connection reset by peer错误")
    print("✅ 实时获取执行进度")
    print("✅ 完整的执行统计信息")
    print("✅ 兼容现有前端代码")
    
    print("\n🔧 关键配置:")
    print('response_mode: "streaming"  # 启用流式模式')
    print('stream=True              # requests启用流式接收')
    print('timeout=(30, 300)        # 适当的超时设置')

if __name__ == "__main__":
    test_streaming_parser()
    test_error_cases()
    demonstrate_integration()
