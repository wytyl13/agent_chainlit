from agent.llm_api.ollama_llm import OllamaLLM
from agent.config.llm_config import LLMConfig
from pathlib import Path
import base64
import asyncio
from tools.utils import Utils
import json

utils = Utils()

olama_config = LLMConfig.from_file(Path("/work/ai/agent_chainlit/config/yaml/shizhen_ollama_config.yaml"))
ollama_shizhen = OllamaLLM(config=olama_config)

def encode_image_to_base64(image_path):
    """将图片文件转换为base64编码"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


# 使用示例
image_path = "/work/ai/agent_chainlit/mianbu.jpeg"
image_base64 = encode_image_to_base64(image_path)

messages = [
    {
    "role": "user",
    "content": "请帮我分析这张面部图像中的症状，从中医角度给出诊断建议",
    "images": [image_base64]
    }
]


result = utils.request_url(
    url="https://ai.shunxikj.com:9002/chat/function_call",
    param_dict={
        "question": "user_question",              # 添加缺少的question字段
        "is_ensure": False, 
        "messages": messages,
        "service_name": "traditional_medical_service"
    },
    timeout=120
)
print(result)

# async def main():
#     response = await ollama_shizhen._whoami_text(
#         messages=messages,
#         timeout=120,
#         use_tool=False,
#         temperature=0.0,
#         tool_call_json=None
#     )
#     print(response)
#     return response


# asyncio.run(main())