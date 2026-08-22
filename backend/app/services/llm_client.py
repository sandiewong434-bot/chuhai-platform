# -*- coding: utf-8 -*-
"""
LLM 客户端统一封装
支持：DeepSeek / Qwen / OpenAI / Kimi (通过 agent-gw)

用法：
    from app.services.llm_client import get_llm_client
    client = get_llm_client()
    response = client.complete("请分析这篇文章...")
"""

import os
from typing import Any

import httpx


class LLMClient:
    """LLM 客户端基类"""
    
    def __init__(self, api_key: str | None = None, base_url: str | None = None, model: str = "default"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
    
    def complete(self, prompt: str, max_tokens: int = 2000, temperature: float = 0.3) -> str:
        """同步调用LLM完成文本生成"""
        raise NotImplementedError


class KimiClient(LLMClient):
    """Kimi API 客户端（通过 Moonshot API）"""
    
    def __init__(self, api_key: str | None = None, model: str = "moonshot-v1-8k"):
        super().__init__(
            api_key=api_key or os.getenv("KIMI_API_KEY"),
            base_url="https://api.moonshot.cn/v1",
            model=model,
        )
    
    def complete(self, prompt: str, max_tokens: int = 2000, temperature: float = 0.3) -> str:
        if not self.api_key:
            raise ValueError("KIMI_API_KEY not set")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        
        try:
            with httpx.Client(timeout=60) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[WARN] LLM调用失败: {e}")
            raise


class DeepSeekClient(LLMClient):
    """DeepSeek API 客户端"""
    
    def __init__(self, api_key: str | None = None, model: str = "deepseek-chat"):
        super().__init__(
            api_key=api_key or os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
            model=model,
        )
    
    def complete(self, prompt: str, max_tokens: int = 2000, temperature: float = 0.3) -> str:
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY not set")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        
        try:
            with httpx.Client(timeout=60) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[WARN] DeepSeek调用失败: {e}")
            raise


def get_llm_client(provider: str | None = None) -> LLMClient | None:
    """
    获取LLM客户端
    
    优先级：
    1. DEEPSEEK_API_KEY → DeepSeek
    2. KIMI_API_KEY → Kimi
    3. None → 返回None（使用规则降级）
    """
    if provider == "deepseek" or (os.getenv("DEEPSEEK_API_KEY") and provider is None):
        return DeepSeekClient()
    elif provider == "kimi" or (os.getenv("KIMI_API_KEY") and provider is None):
        return KimiClient()
    
    return None
