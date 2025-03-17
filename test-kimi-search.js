#!/usr/bin/env node

import OpenAI from 'openai';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// 加载.env文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');

if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('已加载.env文件');
} else {
  config(); // 尝试加载默认.env文件
  console.log('未找到.env文件，使用环境变量');
}

// 检查环境变量
console.log('\n环境变量检查:');
console.log('KIMI_API_KEY:', process.env.KIMI_API_KEY ? '已设置 ✓' : '未设置 ✗');
console.log('KIMI_BASE_URL:', process.env.KIMI_BASE_URL || '未设置，将使用默认值');
console.log('KIMI_MODEL:', process.env.KIMI_MODEL || '未设置，将使用默认值');

// 如果API密钥未设置，则退出
if (!process.env.KIMI_API_KEY) {
  console.error('\n错误: 未设置KIMI_API_KEY环境变量');
  console.error('请设置环境变量: export KIMI_API_KEY=\'your-api-key\'');
  process.exit(1);
}

// 创建OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: process.env.KIMI_BASE_URL || 'https://aiproxy.hzh.sealos.run/v1'
});

// 创建消息辅助函数
const createSystemMessage = (content) => ({
  role: 'system',
  content
});

const createUserMessage = (content) => ({
  role: 'user',
  content
});

const createToolMessage = (toolCallId, name, content) => ({
  role: 'tool',
  tool_call_id: toolCallId,
  name,
  content
});

// 处理工具调用
const handleToolCalls = async (messages, toolCalls) => {
  const newMessages = [...messages];
  
  for (const toolCall of toolCalls) {
    const { function: { name, arguments: args }, id } = toolCall;
    const parsedArgs = JSON.parse(args);
    
    // 处理工具调用
    const result = name === "$web_search" ? 
      parsedArgs : 
      'no tool found';

    newMessages.push(
      createToolMessage(id, name, JSON.stringify(result))
    );
  }
  
  return newMessages;
};

// 处理完成
const processCompletion = async (messages, jsonResponse = true) => {
  try {
    const completion = await client.chat.completions.create({
      model: process.env.KIMI_MODEL || 'moonshot-v1-32k',
      messages,
      temperature: 0.3,
      tools: [{
        type: "builtin_function",
        function: {
          name: "$web_search",
        },
      }],
      ...(jsonResponse && { response_format: { type: "json_object" } })
    });

    const choice = completion.choices[0];
    const newMessages = [...messages, choice.message];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      console.log('检测到工具调用，处理中...');
      const updatedMessages = await handleToolCalls(newMessages, choice.message.tool_calls);
      return processCompletion(updatedMessages, jsonResponse);
    }

    let response;
    try {
      response = jsonResponse ? 
        JSON.parse(choice.message.content) : 
        choice.message.content;
    } catch (e) {
      console.error("解析JSON响应失败:", e);
      response = { error: "解析响应失败", content: choice.message.content };
    }

    return [response, newMessages];
  } catch (error) {
    console.error("Kimi API调用错误:", error);
    throw error;
  }
};

// 测试网络搜索
async function testKimiSearch() {
  console.log('\n测试Kimi网络搜索功能...');
  
  const query = "2024年人工智能发展趋势";
  const role = "你是一位AI技术专家，请提供专业的搜索结果和分析";
  const responseFormat = "请以markdown格式返回，包含标题、链接和简短描述";
  
  console.log(`查询: ${query}`);
  console.log(`角色: ${role}`);
  console.log(`返回格式: ${responseFormat}`);
  
  try {
    const messages = [
      createSystemMessage(role),
      createSystemMessage(responseFormat),
      createUserMessage(`执行网络搜索，查询内容: "${query}"`)
    ];
    
    console.log('\n发送请求...');
    const [response] = await processCompletion(messages, false);
    
    console.log('\nKimi搜索成功! ✓');
    console.log('搜索结果:');
    console.log(response);
    
  } catch (error) {
    console.error('\nKimi搜索失败! ✗');
    console.error('错误信息:', error.message);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testKimiSearch(); 