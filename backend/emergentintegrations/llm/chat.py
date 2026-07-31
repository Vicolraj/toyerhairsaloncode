class UserMessage:
    def __init__(self, text):
        self.text = text

class LlmChat:
    def __init__(self, api_key, session_id, system_message):
        self.api_key = api_key
        self.system_message = system_message
        
    def with_model(self, provider, model):
        return self
        
    async def send_message(self, msg: UserMessage):
        if not self.api_key or "PLACEHOLDER" in self.api_key:
            return "This is a simulated AI response since the LLM key is a placeholder! Please configure it in .env."
            
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": msg.text}
            ]
        )
        return response.choices[0].message.content
