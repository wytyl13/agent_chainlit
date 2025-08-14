import chainlit as cl
import os
from pathlib import Path
import shutil
from typing import Optional
import hashlib
import sys
from io import BytesIO
from pathlib import Path
from dotenv import load_dotenv
import aiohttp
import requests

from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
from chainlit.data.storage_clients.azure import AzureStorageClient


ROOT_DIRECTORY = Path(__file__).parent

# 添加项目路径
project_root = str(ROOT_DIRECTORY)
if project_root not in sys.path:
    sys.path.insert(0, project_root)


from api.table.user_data import UserData
from agent.llm_api.ollama_llm import OllamaLLM
from agent.config.llm_config import LLMConfig
from agent.tool.direct_llm_community_ai_admin import DirectLLMCommunityAiAdmin
from agent.tool.direct_llm_community_ai_user import DirectLLMCommunityAiUser
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


load_dotenv(str(ROOT_DIRECTORY / ".env"))
API_PREFIX = os.getenv("API_PREFIX")

QWEN_OLLAMA_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "ollama_config.yaml")
SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
DEFAULT_RETRIEVAL_DATA_PATH = str(ROOT_DIRECTORY / "retrieval_data")
DEFAULT_RETRIEVAL_STORAGE_PATH = str(ROOT_DIRECTORY / "retrieval_storage")
DEFAULT_EMBEDDING_MODEL = str(ROOT_DIRECTORY / "models" / "embedding" / "AI-ModelScope" / "bge-large-zh-v1.5")


llm_qwen = OllamaLLM(config=LLMConfig.from_file(Path(QWEN_OLLAMA_CONFIG_PATH)))
sql_config = SqlConfig.from_file(SQL_CONFIG_PATH)
enhance_qwen_admin = EnhanceRetrieval(llm=llm_qwen, retrieval_flag=False, data_dir=DEFAULT_RETRIEVAL_DATA_PATH, index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH)
enhance_qwen_user = EnhanceRetrieval(llm=llm_qwen, data_dir=DEFAULT_RETRIEVAL_DATA_PATH, index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH)
retrieval = Retrieval(data_dir=DEFAULT_RETRIEVAL_DATA_PATH, index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH)
direct_llm_tool = DirectLLMCommunityAiAdmin(enhance_llm=enhance_qwen_admin)
direct_llm_tool_user = DirectLLMCommunityAiUser(enhance_llm=enhance_qwen_admin)
google_search_tool = GoogleSearch(retrieval=retrieval)
weather_api = WeatherApi()
handle_tongzhi_tonggao = HandleTongzhiTonggao(enhance_llm=enhance_qwen_admin)
water_machine_api = WaterMachineApi()


init_tools_admin = [handle_tongzhi_tonggao, direct_llm_tool, google_search_tool, weather_api, water_machine_api]
planning_agent = PlanningAgentCommunityAiAdmin(
    tools=init_tools_admin, 
    enhance_llm=enhance_qwen_admin
)

init_tools_user = [direct_llm_tool_user, handle_tongzhi_tonggao, weather_api, water_machine_api]
planning_agent_user = PlanningAgentCommunityAiUser(
    tools=init_tools_user, 
    enhance_llm=enhance_qwen_admin
)


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



# def hash_password(password):
#     """密码哈希"""
#     return hashlib.sha256(password.encode()).hexdigest()



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
        
        tools = []
        if chat_history:
            if len(chat_history) <= 8:
                chat_history = chat_history[1:-1]
            if len(chat_history) > 8:
                chat_history = chat_history[-7:-1]
            
            chat_history = [[chat_history[i]['content'][:30], chat_history[i+1]['content'][:30]] 
                for i in range(0, len(chat_history)-1, 2) 
                if chat_history[i]['role'] == 'user' and chat_history[i+1]['role'] == 'assistant']
            print(chat_history)
            if chat_history:
                _, tool_name = extract_and_clean_tool_info(chat_history[-1][-1])
                print(f"tool_name: ---- {tool_name}")
                for tool in planning_agent.tools:
                    if hasattr(tool, 'name') and tool.name == tool_name:
                        tools.append(tool)
                        break
        print(f"chat_history: ------------------------------- {chat_history}")
        
        try:
            if role == "user":
                async for chunk in planning_agent_user.execute(
                    question=user_text, 
                    chat_history=chat_history, 
                    username=user.identifier, 
                    retrieval_flag=True,
                    location=community,
                    role=role,
                    tools=tools if tools else init_tools_user
                ):
                    await msg.stream_token(chunk)
            else:
                async for chunk in planning_agent.execute(
                    question=user_text, 
                    chat_history=chat_history, 
                    username=user.identifier, 
                    retrieval_flag=False,
                    location=community,
                    role=role,
                    tools=tools if tools else init_tools_admin
                ):
                    await msg.stream_token(chunk)
            await msg.send()
        except Exception as e:
            error_msg = f"处理请求时发生错误: {str(e)}"
            await cl.Message(content=error_msg).send()


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
            await cl.Message(content=f"{community}超管，您好！您可以直接上传文件或纯文字到会话框！").send()
    else:
        # 用户未登录，显示默认消息
        await cl.Message(content=f"{community}超管，您好！您可以直接上传文件或纯文字到会话框！").send()