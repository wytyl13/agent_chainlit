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

from api.table.base.user_data import UserData
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
from api.table.base.community_real_time_data import CommunityRealTimeData
from agent.tool.water_machine_api import WaterMachineApi
from agent.config.sql_config import SqlConfig
from tag_processor import TagProcessor


tag_process = TagProcessor()
environment = dotenv_values(str(ROOT_DIRECTORY / ".env"))
print(environment)
SQL_API_PREFIX = os.getenv("SQL_API_PREFIX")
FUNCTION_CALL_API_PREFIX = os.getenv("FUNCTION_CALL_API_PREFIX")
START_SERVICE_API = f"{FUNCTION_CALL_API_PREFIX}/chat/function_call/start"

FUNCTION_CALL_API = f"{FUNCTION_CALL_API_PREFIX}/chat/function_call"
SUGGESTION_API = f"{FUNCTION_CALL_API_PREFIX}/chat/suggestion"


SQL_CONFIG_PATH = environment["SQL_CONFIG_PATH"] if "SQL_CONFIG_PATH" in environment else None
SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml") if SQL_CONFIG_PATH is None else SQL_CONFIG_PATH
sql_config = SqlConfig.from_file(SQL_CONFIG_PATH)


# 在文件顶部添加全局变量
audio_buffer = None

SAVE_DIR = str(ROOT_DIRECTORY / "upload_dir")

SERVICE_INFO_JSON = utils.request_url(url=f"{SQL_API_PREFIX}/api/service_info", param_dict={"username": "shunxikeji"})
SERVICE_INFO_DICT = {item['service_id']: {'service_name': item['service_name'], 'emoji': item['emoji'], 'action': item['action'], 'identifier': f":{item['identifier']}"} for item in SERVICE_INFO_JSON}


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


def create_service_action_callbacks():
    """动态为每个服务创建Action回调函数"""
    for item in SERVICE_INFO_JSON:
        service_url = item["service_id"]
        action = item["action"]
        service_name = item["service_name"]
        
        # 创建回调函数
        async def switch_service_callback(action, service_url=service_url, service_name=service_name):
            cl.user_session.set("selected_service", service_url)
            await cl.Message(content=f"✅ 已切换到{service_name}").send()
        
        # 注册回调函数
        cl.action_callback(action)(switch_service_callback)


# 调用函数来注册所有回调
create_service_action_callbacks()


# 3. 添加查看当前服务的回调
@cl.action_callback("show_current_service")
async def show_current_service(action):
    current_service = cl.user_session.get("selected_service", "welcome_system")
    service_name = SERVICE_INFO_DICT[current_service]["service_name"]
    await cl.Message(content=f"📍 当前正在使用：{service_name}").send()


@cl.action_callback("switch_to_meal_subsystem")
async def switch_to_meal_subsystem(action):
    cl.user_session.set("selected_service", "meal_assistance_subsystem")
    await cl.Message(content="✅ 已切换到助餐服务子系统").send()


@cl.action_callback("switch_to_meal_service_app")
async def switch_to_meal_service_app(action):
    cl.user_session.set("selected_service", "meal_assistance_service_app")
    await cl.Message(content="✅ 已切换到助餐服务应用").send()

    
@cl.action_callback("switch_to_real_time_vital_analyze_service")
async def switch_to_real_time_vital_analyze_service(action):
    cl.user_session.set("selected_service", "real_time_vital_analyze_service")
    await cl.Message(content="✅ 已切换实时生命体征监测系统").send()

@cl.action_callback("switch_to_merchant_service_system")
async def switch_to_merchant_service_system(action):
    cl.user_session.set("selected_service", "merchant_service_system")
    await cl.Message(content="✅ 已切换商家服务系统").send()

@cl.action_callback("switch_to_traditional_medical_service")
async def switch_to_merchant_service_system(action):
    cl.user_session.set("selected_service", "traditional_medical_service")
    await cl.Message(content="✅ 已切换中医问诊").send()


@cl.set_starters
async def set_starters():
    # 返回通用的预设问题（所有用户都能看到）
    # user = cl.user_session.get("user")
    # print(f"user: ----------------------------------------------------------------------- {user}")
    return [
        cl.Starter(
            label="🏠 助餐子系统",
            message="欢迎使用助餐子系统:meal_assistance_subsystem",
        ),
        cl.Starter(
            label="🍽️ 助餐服务应用",
            message="欢迎使用助餐服务应用:meal_assistance_service_app",
        ),
        cl.Starter(
            label="🍽️ 实时生命体征监测系统",
            message="欢迎实时生命体征监测系统:real_time_vital_analyze_service",
        ),
        cl.Starter(
            label="🍽️ 商家服务系统",
            message="欢迎商家服务系统:merchant_service_system",
        ),
        cl.Starter(
            label="🍽️ 中医问诊",
            message="欢迎进入中医问诊:traditional_medical_service",
        )
    ]

import base64
def encode_image_to_base64(image_path):
    """将图片文件转换为base64编码"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


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
        url = f"{SQL_API_PREFIX}/api/user_data"
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


@cl.on_message  
async def main(message: cl.Message):
    """
    处理用户消息和保存附件文件到固定目录
    
    Args:
        message: 用户的消息，包含文本内容和可能的附件
    """
    current_service = cl.user_session.get("selected_service", "welcome_system")
    
    user = cl.user_session.get("user")
    community = user.metadata.get("community") if user.metadata else None
    role = user.metadata.get("role") if user.metadata else None
    # 确保保存目录存在
    Path(SAVE_DIR).mkdir(parents=True, exist_ok=True)
    
    # 获取用户的文本内容
    user_text = message.content
    print(f"user_text: ---------------------------------------------- {user_text}")
    
    # ========== 动态服务切换逻辑 ==========
    service_switched = False
    for item in SERVICE_INFO_JSON:
        service_url = item["service_id"]
        service_name = item["service_name"]
        identifier = item["identifier"]
        if identifier in user_text:
            user_text = user_text.replace(identifier, "").strip()
            cl.user_session.set("selected_service", service_url)
            await cl.Message(content=f"✅ 已切换到{service_name}").send()
            service_switched = True
            break
    
    if not service_switched:
        print(f"继续使用当前服务: {current_service}")
    
    # 如果用户只是切换服务而没有其他内容，就不需要继续处理
    if not user_text.strip():
        return
    
    msg = cl.Message(content="")
    # 检查是否有附件
    if message.elements:
        # await cl.Message(content=f"收到您的消息: {user_text}").send()
        images = []
        chat_history = cl.chat_context.to_openai() if cl.chat_context.to_openai() else []
        print(f"chat_history: ------------------------------- {chat_history}")
        chat_history = chat_history[1:-1][-6:] if chat_history else []
        print(f"chat_history: ------------------------------- {chat_history}")
        # 处理每个附件
        # 支持的图片格式
        IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'}
        try:
            for element in message.elements:
                if isinstance(element, cl.File):
                    original_filename = element.name
                    file_extension = Path(original_filename).suffix.lower()
                    
                    # 只处理图片文件
                    if file_extension in IMAGE_EXTENSIONS:
                        try:
                            # 读取图片文件
                            with open(element.path, "rb") as image_file:
                                image_content = image_file.read()
                            
                            # 转换为base64
                            image_base64 = base64.b64encode(image_content).decode('utf-8')
                            
                            # 添加到列表
                            images.append(image_base64)
                            print(f"成功转换图片: {original_filename}")
                            
                        except Exception as e:
                            await cl.Message(content=f"图片转换错误 {original_filename}: {str(e)}").send()
                    else:
                        print(f"跳过非图片文件: {original_filename}")
            chat_history.append({"role": "user", "content": f"精简回答以下问题：{user_text}", "images": images})
            param_dict = {
                "question": user_text,
                "messages": chat_history,
                "service_name": current_service
            }
            print(f"param_dict: ----------------------- {param_dict}")
            result = utils.request_url(
                url=FUNCTION_CALL_API,
                param_dict=param_dict,
                timeout=120
            )
            segments = None
            try:
                segments = json.loads(result)
                print("接受到json格式返回数据")
            except Exception as e:
                print("接受到字符串格式返回数据")
                segments = utils.parse_content(content=result)
            chat_history = cl.chat_context.to_openai() if cl.chat_context.to_openai() else []
            chat_history = chat_history[1:][-6:]
            result_seg = await tag_process.process_segments(segments=segments, chat_history=chat_history, function_call_url=FUNCTION_CALL_API, service_name=current_service)
        except Exception as e:
            import traceback
            error_msg = f"处理请求时发生错误: {str(e)}\n{traceback.format_exc()}"
            await cl.Message(content=error_msg).send()
        finally:
            # ========== 动态创建Action按钮 ==========
            current_service = cl.user_session.get("selected_service", "welcome_system")
            current_service_name = SERVICE_INFO_DICT[current_service]["service_name"]
            
            # 使用循环创建除当前服务外的所有切换按钮
            actions = []
            for item in SERVICE_INFO_JSON:
                service_url = item["service_id"]
                service_name = item["service_name"]
                action = item["action"]
                emoji = item["emoji"]
                if service_url != current_service:
                    actions.append(
                        cl.Action(
                            name=action,
                            value=action,
                            payload={"service_url": service_url},
                            label=f"{emoji} 切换到{service_name}"
                        )
                    )
            
            await cl.Message(
                content=f"💡 当前使用: {current_service_name} | 快速操作：",
                actions=actions
            ).send()
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
                    "messages": chat_history,
                    "service_name": current_service
                }
                print(f"param_dict: ----------------------- {param_dict}")
                result = utils.request_url(
                    url=FUNCTION_CALL_API,
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
                result_seg = await tag_process.process_segments(segments=segments, chat_history=chat_history, function_call_url=FUNCTION_CALL_API, service_name=current_service)
            else:
                await msg.stream_token("暂未开通")
        except Exception as e:
            import traceback
            error_msg = f"处理请求时发生错误: {str(e)}\n{traceback.format_exc()}"
            await cl.Message(content=error_msg).send()
        finally:
            # ========== 动态创建Action按钮 ==========
            current_service = cl.user_session.get("selected_service", "welcome_system")
            current_service_name = SERVICE_INFO_DICT[current_service]["service_name"]
            
            # 使用循环创建除当前服务外的所有切换按钮
            actions = []
            for item in SERVICE_INFO_JSON:
                service_url = item["service_id"]
                service_name = item["service_name"]
                action = item["action"]
                emoji = item["emoji"]
                if service_url != current_service:
                    actions.append(
                        cl.Action(
                            name=action,
                            value=action,
                            payload={"service_url": service_url},
                            label=f"{emoji} 切换到{service_name}"
                        )
                    )
            
            await cl.Message(
                content=f"💡 当前使用: {current_service_name} | 快速操作：",
                actions=actions
            ).send()
            


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
    url = f"{SQL_API_PREFIX}/api/community_real_time_data"
    response = requests.get(url, timeout=10)
    tonggao_results = []
    if response.status_code == 200:
        result = response.json()
        if result.get("success") and result.get("data"):
            tonggao_results = result.get("data", [])
    tonggao = tonggao_results[-1]["content"] if tonggao_results else "暂无！"
    cl.user_session.set("selected_service", "welcome_system")
    
    # if user:
    #     try:
    #         # 从用户元数据中获取角色，如果没有则查询数据库
    #         user_role = user.metadata.get("role") if user.metadata else None
    #         community = user.metadata.get("community") if user.metadata else None
            
            
    #         # 根据角色显示不同内容
    #         if user_role == "admin":
    #             message_content = f"""
    #             {community}超管，您好！我是你的社区智能体助手，我可以帮你发布时讯消息、通告等其它操作！
    #             💬 使用方式：
    #             📝 文本输入：直接在对话框中输入您的问题
    #             🎤 语音输入：按住麦克风按钮进行语音录入
    #             📎 文件上传：点击输入框旁的附件按钮上传文件
    #             提示：首次使用语音功能时，浏览器可能会询问麦克风权限，请点击"允许"。
    #             """
    #         else:  # user 或其他角色
    #             message_content = f"""
    #             尊敬的{community}用户，您好！我是你的社区智能体助手，你可以咨询我任何问题！
    #             【通告】📢{tonggao}
    #             💬 使用方式：
    #             📝 文本输入：直接在对话框中输入您的问题
    #             📎 文件上传：点击输入框旁的附件按钮上传文件
    #             🎤 语音输入：按住麦克风按钮进行语音录入
    #             提示：首次使用语音功能时，浏览器可能会询问麦克风权限，请点击"允许"。
    #             """
                
    #         await cl.Message(content=message_content).send()
                
    #     except Exception as e:
    #         # 数据库查询失败，显示默认消息
    #         print(f"{str(e)}")
    #         await cl.Message(content=f"{community}超管，您好！您可以直接上传文件或纯文字到会话框！").send()
    # else:
    #     # 用户未登录，显示默认消息
    #     await cl.Message(content=f"{community}超管，您好！您可以直接上传文件或纯文字到会话框！").send()