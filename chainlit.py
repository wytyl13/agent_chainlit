import chainlit as cl

import os
from pathlib import Path
import shutil
from typing import Optional
import hashlib
import sys
from io import BytesIO
from pathlib import Path
from dotenv import load_dotenv, dotenv_values
import aiohttp
import requests
import re
import asyncio
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import io
from typing import (
    Dict
)
import json
from tools.utils import Utils

from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
from chainlit.data.storage_clients.azure import AzureStorageClient

utils = Utils()
ROOT_DIRECTORY = Path(__file__).parent

# 添加项目路径
project_root = str(ROOT_DIRECTORY)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.table.user_data import UserData
from agent.llm_api.ollama_llm import OllamaLLM
from agent.config.llm_config import LLMConfig
from agent.tool.direct_llm_community_ai_admin import DirectLLMCommunityAiAdmin
from agent.tool.google_search import GoogleSearch
from agent.tool.weather_api import WeatherApi
from agent.tool.retrieval import Retrieval
from agent.tool.planning_agent_community_ai_admin import PlanningAgentCommunityAiAdmin
from agent.tool.planning_agent_community_ai_user import PlanningAgentCommunityAiUser
from agent.tool.enhance_retrieval import EnhanceRetrieval
from agent.tool.handle_shixun_tonggao import HandleTongzhiTonggao
from api.table.community_real_time_data import CommunityRealTimeData
from agent.tool.water_machine_api import WaterMachineApi
from agent.config.sql_config import SqlConfig
from tag_processor import TagProcessor

tag_process = TagProcessor()
environment = dotenv_values(str(ROOT_DIRECTORY / ".env"))
print(environment)
API_PREFIX = os.getenv("API_PREFIX")
START_SERVICE_API = f"{API_PREFIX}/chat/function_call/start"
FOOD_MANAGER_SERVICE_API = f"{API_PREFIX}/chat/function_call/food_manager_server"
FOOD_USER_SERVICE_API = f"{API_PREFIX}/chat/function_call/food_user_server"

SQL_CONFIG_PATH = environment["SQL_CONFIG_PATH"] if "SQL_CONFIG_PATH" in environment else None
SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml") if SQL_CONFIG_PATH is None else SQL_CONFIG_PATH
sql_config = SqlConfig.from_file(SQL_CONFIG_PATH)

# 在文件顶部添加全局变量
audio_buffer = None

SAVE_DIR = str(ROOT_DIRECTORY / "upload_dir")


def extract_and_clean_tool_info(text):
    """从 :{工具名}TOOL收到 格式中提取工具信息"""
    import re
    
    # 匹配 : 和 TOOL 之间的内容
    pattern = r':([^T]*?)TOOL'
    
    tool_match = re.search(pattern, text)
    tool_name = tool_match.group(1) if tool_match else None
    
    # 移除标记部分（从 : 开始到 TOOL收到 结束）
    clean_pattern = r':([^T]*?)TOOL收到'
    clean_text = re.sub(clean_pattern, '', text)
    
    return clean_text, tool_name


# 功能菜单----------------------------------------------------------------------------------------------
async def create_function_menu(user_role, community):
    """根据用户角色创建不同的功能菜单"""
    
    if user_role == "admin":
        # 管理员功能菜单
        actions = [
            cl.Action(
                name="publish_notice",
                payload={"action": "publish_notice"},
                label="📢 发布通告"
            ),
            cl.Action(
                name="view_statistics", 
                payload={"action": "view_statistics"},
                label="📊 数据统计"
            ),
            cl.Action(
                name="user_management",
                payload={"action": "user_management"},
                label="👥 用户管理"
            ),
            cl.Action(
                name="system_settings",
                payload={"action": "system_settings"},
                label="⚙️ 系统设置"
            )
        ]
    else:
        # 普通用户功能菜单
        actions = [
            cl.Action(
                name="user_server",
                payload={"action": "user_server"},
                label="🏥 用户服务端"
            ),
            cl.Action(
                name="start",
                payload={"action": "star"},
                label="🛒 起始测试服务"
            ),
        ]
    
    return actions


@cl.on_settings_update
async def setup_menu(settings):
    """处理菜单选择"""
    selected_function = settings.get("quick_function")
    
    if selected_function == "📢 发布通告":
        await cl.Message(content="📢 请输入您要发布的通告内容：").send()
    elif selected_function == "📊 数据统计":
        await cl.Message(content="📊 正在为您生成统计数据...").send()
    elif selected_function == "👥 用户管理":
        await cl.Message(content="👥 用户管理功能：\n1. 查看用户列表\n2. 添加新用户\n3. 修改用户权限\n4. 删除用户").send()
    elif selected_function == "⚙️ 系统设置":
        await cl.Message(content="⚙️ 系统设置：\n1. 基础设置\n2. 安全设置\n3. 通知设置\n4. 备份设置").send()
    elif selected_function == "🏥 服务咨询":
        await cl.Message(content="🏥 服务咨询：请问您需要咨询什么服务？\n1. 医疗健康\n2. 生活服务\n3. 娱乐活动\n4. 其他服务").send()
    elif selected_function == "🛒 在线购物":
        await cl.Message(content="🛒 欢迎来到在线购物！请选择商品类别：\n1. 生活用品\n2. 食品饮料\n3. 健康用品\n4. 其他商品").send()
    elif selected_function == "🍽️ 餐饮服务":
        await cl.Message(content="🍽️ 餐饮服务：\n1. 查看今日菜单\n2. 预订餐食\n3. 营养咨询\n4. 特殊饮食需求").send()
    elif selected_function == "📚 课程预约":
        await cl.Message(content="📚 课程预约：\n1. 查看可预约课程\n2. 我的课程安排\n3. 取消预约\n4. 课程反馈").send()
    elif selected_function == "💰 补贴查询":
        await cl.Message(content="💰 补贴查询：\n1. 查看可申请补贴\n2. 补贴申请状态\n3. 历史补贴记录\n4. 补贴政策咨询").send()


def create_chat_settings(user_role):
    """创建固定的功能菜单设置面板"""
    
    if user_role == "admin":
        return cl.ChatSettings([
            cl.input_widget.Select(
                id="quick_function",
                label="🎯 快捷功能",
                values=[
                    "选择功能...",
                    "📢 发布通告", 
                    "📊 数据统计",
                    "👥 用户管理", 
                    "⚙️ 系统设置"
                ],
                initial_index=0,
            )
        ])
    else:
        return cl.ChatSettings([
            cl.input_widget.Select(
                id="quick_function", 
                label="🎯 快捷功能",
                values=[
                    "选择功能...",
                    "🏥 服务咨询",
                    "🛒 在线购物", 
                    "🍽️ 餐饮服务",
                    "📚 课程预约",
                    "💰 补贴查询"
                ],
                initial_index=0,
            )
        ])


# 处理功能菜单点击事件
@cl.action_callback("publish_notice")
async def on_publish_notice(action):
    await cl.Message(content="📢 请输入您要发布的通告内容：").send()


@cl.action_callback("manage_services") 
async def on_manage_services(action):
    await cl.Message(content="🛠️ 服务管理功能已启动，请选择要管理的服务类型：\n1. 医疗服务\n2. 生活服务\n3. 娱乐服务").send()


@cl.action_callback("view_statistics")
async def on_view_statistics(action):
    await cl.Message(content="📊 正在为您生成统计数据...").send()
    # 这里可以调用你的数据统计功能
    # 例如：生成图表、调用数据中心等


@cl.action_callback("user_management")
async def on_user_management(action):
    await cl.Message(content="👥 用户管理功能：\n1. 查看用户列表\n2. 添加新用户\n3. 修改用户权限\n4. 删除用户").send()


@cl.action_callback("system_settings")
async def on_system_settings(action):
    await cl.Message(content="⚙️ 系统设置：\n1. 基础设置\n2. 安全设置\n3. 通知设置\n4. 备份设置").send()


@cl.action_callback("user_server")
async def on_user_server(action):
    await cl.Message(content="🏥 服务咨询：请问您需要咨询什么服务？\n1. 医疗健康\n2. 生活服务\n3. 娱乐活动\n4. 其他服务").send()

@cl.action_callback("start")
async def on_start(action):
    await cl.Message(content="🛒 欢迎来到在线购物！请选择商品类别：\n1. 生活用品\n2. 食品饮料\n3. 健康用品\n4. 其他商品").send()
# 功能菜单----------------------------------------------------------------------------------------------


@cl.data_layer
def get_data_layer():
    return SQLAlchemyDataLayer(
        conninfo=sql_config.sql_url,
        # storage_provider=storage_client  # 可选
    )


@cl.step(type="tool")
async def tool_1():
    # Fake tool
    await cl.sleep(2)
    return "Response from the tool!"


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    
    # 如果是静态资源请求，直接跳过认证（这是一个workaround）
    if not username or not password:
        return None
    try:
        url = f"{API_PREFIX}/api/user_data"
        params = {"username": username}
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get("success") and result.get("data"):
                user_data = result["data"] if result["data"] else None
                
                if user_data and len(user_data) > 0:
                    user = user_data[0]
                    # 验证密码
                    if user["password"] == password:
                        return cl.User(
                            identifier=username, 
                            metadata={"role": user["role"], "community": user["community"]},
                            
                        )
        return None
    except Exception as e:
        import traceback
        error = traceback.format_exc()
        cl.ErrorMessage(f"数据库连接错误: {str(e)} \n {error}")
        return None


@cl.on_audio_chunk
async def on_audio_chunk(chunk: cl.InputAudioChunk):
    """处理来自用户麦克风的音频块"""
    global audio_buffer
    
    if chunk.isStart:
        # 音频开始录制时重置缓冲区
        audio_buffer = BytesIO()
        await cl.Message(content="🎤 开始录音...").send()
    
    # 将音频块写入缓冲区
    if chunk.data:
        audio_buffer.write(chunk.data)


async def create_menu_cards():
    """使用 CustomElement 创建菜单卡片"""
    
    # 菜品数据
    dishes = [
        {
            "dish_id": "001",
            "dish_name": "宫保鸡丁",
            "category": "川菜",
            "price": "¥28",
            "ingredients": "鸡肉、花生、青椒、红椒",
            "nutrition": "高蛋白、维生素C",
            "rating": "4.8",
            "availability": "有货",
            "description": "经典川菜，麻辣鲜香，鸡肉嫩滑配花生脆香"
        },
        {
            "dish_id": "002", 
            "dish_name": "红烧狮子头",
            "category": "淮扬菜",
            "price": "¥35",
            "ingredients": "猪肉、马蹄、冬菇、青菜",
            "nutrition": "高蛋白、膳食纤维",
            "rating": "4.6",
            "availability": "有货",
            "description": "淮扬名菜，肉质鲜嫩，汤汁醇厚，营养丰富"
        },
        {
            "dish_id": "003",
            "dish_name": "清蒸鲈鱼",
            "category": "粤菜",
            "price": "¥42",
            "ingredients": "新鲜鲈鱼、蒸鱼豉油、葱丝",
            "nutrition": "高蛋白、低脂肪、DHA",
            "rating": "4.9",
            "availability": "缺货",
            "description": "粤式经典，鱼肉鲜嫩，保持原汁原味"
        }
    ]
    
    # 创建自定义元素
    menu_element = cl.CustomElement(
        name="MenuCards",
        props={"dishes": dishes}
    )
    
    await cl.Message(
        content="🍽️ **今日推荐菜单** - 点击卡片上的按钮进行操作",
        elements=[menu_element]
    ).send()


@cl.on_audio_end
async def on_audio_end(audio: cl.Audio):
    """处理录音结束"""
    global audio_buffer
    
    await cl.Message(
        content="🎤 录音结束，正在处理...", 
        elements=[audio]
    ).send()
    
    # 重置音频缓冲区
    audio_buffer = BytesIO()


# 会话恢复处理
@cl.on_chat_resume
async def on_chat_resume(thread):
    pass


async def show_confirmation_popup(content="确认此操作吗？"):
    """类似弹窗的确认对话框"""
    try:
        # 使用AskUserMessage创建类似弹窗的体验
        res = await cl.AskUserMessage(
            content=f"⚠️ **确认操作**\n\n{content}\n\n请输入 **确认** 或 **取消**：",
            timeout=30
        ).send()
        
        if res:
            user_input = res['output'].lower().strip()
            if '确认' in user_input or 'yes' in user_input or 'y' == user_input:
                await cl.Message(content="✅ 操作已确认").send()
                return True
            else:
                await cl.Message(content="❌ 操作已取消").send()
                return False
        else:
            await cl.Message(content="⏰ 操作超时，已自动取消").send()
            return False
            
    except Exception as e:
        await cl.Message(content="❌ 确认过程出错，操作已取消").send()
        return False


async def show_confirmation(content="确认此操作吗？"):
    actions = [
        cl.Action(name="continue", payload={"value": "确认"}, label="🟢 确认操作"),
        cl.Action(name="cancel", payload={"value": "取消"}, label="🔴 取消操作")
    ]
    
    res = await cl.AskActionMessage(
        content=f"⚠️ **操作确认**\n\n{content}",
        actions=actions
    ).send()
    
    
    if res and res.get("payload").get("value") == "确认":
        # 调用确认接口
        await cl.Message(
            content="确认!",
        ).send()


@cl.on_message  
async def main(message: cl.Message):
    """
    处理用户消息和保存附件文件到固定目录
    
    Args:
        message: 用户的消息，包含文本内容和可能的附件
    """
    # 处理菜单按钮点击
    if message.content.startswith("###MENU_ACTION###"):
        action_id = message.content.replace("###MENU_ACTION###", "")
        
        # 根据action_id处理不同功能
        if action_id == "publish_notice":
            await cl.Message(content="📢 请输入您要发布的通告内容：").send()
        elif action_id == "view_statistics":
            await cl.Message(content="📊 正在为您生成统计数据...").send()
        elif action_id == "user_management":
            await cl.Message(content="👥 用户管理功能：\n1. 查看用户列表\n2. 添加新用户\n3. 修改用户权限\n4. 删除用户").send()
    
    
    user = cl.user_session.get("user")
    community = user.metadata.get("community") if user.metadata else None
    role = user.metadata.get("role") if user.metadata else None
    # 确保保存目录存在
    Path(SAVE_DIR).mkdir(parents=True, exist_ok=True)
    
    # 获取用户的文本内容
    user_text = message.content
    msg = cl.Message(content="")
    # 检查是否有附件
    if message.elements:
        await cl.Message(content=f"收到您的消息: {user_text}").send()
        
        saved_files = []
        
        # 处理每个附件
        for element in message.elements:
            if isinstance(element, cl.File):
                # 获取原始文件名
                original_filename = element.name
                
                # 构建保存路径
                save_path = os.path.join(SAVE_DIR, original_filename)
                
                # 如果文件已存在，添加数字后缀
                counter = 1
                base_name, ext = os.path.splitext(original_filename)
                while os.path.exists(save_path):
                    new_filename = f"{base_name}_{counter}{ext}"
                    save_path = os.path.join(SAVE_DIR, new_filename)
                    counter += 1
                
                try:
                    # 复制文件到目标目录
                    shutil.copy2(element.path, save_path)
                    saved_files.append(os.path.basename(save_path))
                    
                except Exception as e:
                    await cl.Message(content=f"文件上传错误 {original_filename} : {str(e)}").send()
        
        if saved_files:
            files_list = ", ".join(saved_files)
            await cl.Message(content=f"收到文件 {files_list}").send()
    
    else:
        # 没有附件，只有文本
        print(f"username: ================ {user.identifier}")
        print(f"community: ================ {community}")
        print(f"role: ================ {role}")
        chat_history = cl.chat_context.to_openai() if cl.chat_context.to_openai() else []
        print(f"chat_history: ------------------------------- {chat_history}")
        chat_history = chat_history[1:-1][-6:]
        print(f"chat_history: ------------------------------- {chat_history}")
        try:
            if role == "user":
                msg = cl.Message(content="")
                param_dict = {
                    "question": user_text,
                    "messages": chat_history
                }
                result = utils.request_url(
                    url=FOOD_MANAGER_SERVICE_API,
                    param_dict=param_dict
                )
                print("================================")
                print(f"result: ------------------------------------{result}")
                print("================================")
                segments = None
                try:
                    segments = json.loads(result)
                    print("接受到json格式返回数据")
                except Exception as e:
                    print("接受到字符串格式返回数据")
                    segments = utils.parse_content(content=result)
                chat_history = cl.chat_context.to_openai() if cl.chat_context.to_openai() else []
                chat_history = chat_history[1:][-6:]
                result_seg = await tag_process.process_segments(segments=segments, chat_history=chat_history, function_call_url=FOOD_MANAGER_SERVICE_API)
            else:
                await msg.stream_token("暂未开通")
        except Exception as e:
            import traceback
            error_msg = f"处理请求时发生错误: {str(e)}\n{traceback.format_exc()}"
            await cl.Message(content=error_msg).send()
        finally:
            # 可以在这里添加会话提示功能。每次对话回复完成以后都添加
            # 将会话提示以按钮的形式输出
            pass


@cl.on_chat_start
async def start():
    """初始化聊天会话"""
    # 初始化音频缓冲区
    global audio_buffer
    audio_buffer = BytesIO()
    
    # 设置音频配置
    cl.user_session.set("audio_enabled", True)
    # 获取当前用户
    user = cl.user_session.get("user")
    url = f"{API_PREFIX}/api/community_real_time_data"
    response = requests.get(url, timeout=10)
    tonggao_results = []
    if response.status_code == 200:
        result = response.json()
        if result.get("success") and result.get("data"):
            tonggao_results = result.get("data", [])
    tonggao = tonggao_results[-1]["content"] if tonggao_results else "暂无！"
    
    if user:
        try:
            # 从用户元数据中获取角色，如果没有则查询数据库
            user_role = user.metadata.get("role") if user.metadata else None
            community = user.metadata.get("community") if user.metadata else None
            
            # 添加这两行代码：
            chat_settings = create_chat_settings(user_role)
            await chat_settings.send()
            
            # 根据角色显示不同内容
            if user_role == "admin":
                message_content = f"""
                {community}超管，您好！我是你的社区智能体助手，我可以帮你发布时讯消息、通告等其它操作！
                💬 使用方式：
                📝 文本输入：直接在对话框中输入您的问题
                🎤 语音输入：按住麦克风按钮进行语音录入
                📎 文件上传：点击输入框旁的附件按钮上传文件
                提示：首次使用语音功能时，浏览器可能会询问麦克风权限，请点击"允许"。
                """
            else:  # user 或其他角色
                message_content = f"""
                尊敬的{community}用户，您好！我是你的社区智能体助手，你可以咨询我任何问题！
                【通告】📢{tonggao}
                💬 使用方式：
                📝 文本输入：直接在对话框中输入您的问题
                📎 文件上传：点击输入框旁的附件按钮上传文件
                🎤 语音输入：按住麦克风按钮进行语音录入
                提示：首次使用语音功能时，浏览器可能会询问麦克风权限，请点击"允许"。
                """
                
            await cl.Message(content=message_content).send()
                
        except Exception as e:
            # 数据库查询失败，显示默认消息
            print(f"{str(e)}")
            await cl.Message(content=f"{community}超管，您好！您可以直接上传文件或纯文字到会话框！").send()
    else:
        # 用户未登录，显示默认消息
        await cl.Message(content=f"{community}超管，您好！您可以直接上传文件或纯文字到会话框！").send()