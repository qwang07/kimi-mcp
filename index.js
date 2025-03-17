#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
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
  console.error('已加载.env文件');
} else {
  config(); // 尝试加载默认.env文件
  console.error('未找到.env文件，使用环境变量');
}

// 服务器配置
const SERVER_CONFIG = {
  name: "kimi-search-server",
  version: "1.0.0",
};

// Kimi API配置
const KIMI_CONFIG = {
  client: new OpenAI({
    apiKey: process.env.KIMI_API_KEY, // 默认使用示例密钥，建议通过环境变量设置
    baseURL: process.env.KIMI_BASE_URL || 'https://aiproxy.hzh.sealos.run/v1'
  }),
  model: process.env.KIMI_MODEL || "moonshot-v1-32k",
  temperature: 0.3,
  maxTokens: 8192,
  systemPrompt: process.env.KIMI_SYSTEM_PROMPT || '你是 Kimi，由 Moonshot AI 提供的人工智能助手。请执行网络搜索并返回结果。',
  tools: [{
    type: "builtin_function",
    function: {
      name: "$web_search",
    },
  }]
};

// 搜索参数Schema
const SearchArgsSchema = z.object({
  query: z.string().describe("搜索查询内容"),
  role: z.string().default('你是 Kimi，由 Moonshot AI 提供的人工智能助手。请执行网络搜索并返回结果。').describe("Kimi的角色定义"),
  responseFormat: z.string().optional().describe("期望的返回格式，可以是JSON格式的描述")
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
    const completion = await KIMI_CONFIG.client.chat.completions.create({
      model: KIMI_CONFIG.model,
      messages,
      temperature: KIMI_CONFIG.temperature,
      tools: KIMI_CONFIG.tools,
      ...(jsonResponse && { response_format: { type: "json_object" } })
    });

    const choice = completion.choices[0];
    const newMessages = [...messages, choice.message];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const updatedMessages = await handleToolCalls(newMessages, choice.message.tool_calls);
      return processCompletion(updatedMessages, jsonResponse);
    }

    let response;
    try {
      response = jsonResponse ? 
        JSON.parse(choice.message.content) : 
        choice.message.content;
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      response = { error: "Failed to parse response", content: choice.message.content };
    }

    return [response, newMessages];
  } catch (error) {
    console.error("Error in Kimi API call:", error);
    throw error;
  }
};

// 执行Kimi搜索
async function performKimiSearch(query, role, responseFormat) {
  const messages = [
    createSystemMessage(role || KIMI_CONFIG.systemPrompt),
  ];
  
  // 如果提供了响应格式，添加格式指导
  if (responseFormat) {
    messages.push(createSystemMessage(responseFormat));
  } else {
    messages.push(createSystemMessage(`
请使用如下 JSON 格式输出你的回复：

{
  "type": "search_results",
  "data": [
    {
      "title": "<标题>",
      "url": "<URL>",
      "description": "<描述>",
      "metadata": {
        "type": "<内容类型>",
        "source": "<来源>"
      }
    }
  ],
  "metadata": {
    "query": "<查询>",
    "timestamp": "<时间戳>",
    "resultCount": "<结果数量>",
    "queryAnalysis": {
      "language": "<语言>",
      "topics": ["<主题1>", "<主题2>"]
    }
  }
}

请确保返回的是有效的JSON格式。
`));
  }
  
  messages.push(createUserMessage(`执行网络搜索，查询内容: "${query}"`));

  try {
    const [response] = await processCompletion(messages, responseFormat ? false : true);
    return response;
  } catch (error) {
    throw error;
  }
}

// 创建MCP服务器
const server = new Server(
  SERVER_CONFIG,
  {
    capabilities: {
      tools: {},
    },
  }
);

// 处理工具列表请求 - 支持标准MCP方法名和自定义方法名
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "使用Kimi AI搜索网络",
        inputSchema: zodToJsonSchema(SearchArgsSchema),
      }
    ],
  };
});

// 处理工具调用请求 - 支持标准MCP方法名和自定义方法名
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name !== "search") {
      throw Object.assign(
        new Error(`未知工具: ${name}`),
        { errorType: 'UNKNOWN_TOOL', name }
      );
    }

    const parsed = SearchArgsSchema.safeParse(args);
    if (!parsed.success) {
      throw Object.assign(
        new Error(`无效参数: ${parsed.error}`),
        { errorType: 'INVALID_ARGS', details: parsed.error }
      );
    }

    const searchResults = await performKimiSearch(
      parsed.data.query,
      parsed.data.role,
      parsed.data.responseFormat
    );

    return {
      content: [{
        type: "text",
        text: typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults, null, 2)
      }]
    };
  } catch (error) {
    console.error("Search error:", error);
    
    const errorResponse = {
      type: 'search_error',
      message: error instanceof Error ? error.message : String(error),
      suggestion: '你可以尝试：1. 修改搜索关键词 2. 检查API密钥是否有效 3. 调整角色描述或返回格式',
      context: {
        query: request.params.arguments?.query,
        role: request.params.arguments?.role
      }
    };

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(errorResponse, null, 2)
      }],
      isError: true
    };
  }
});

// 运行服务器
async function runServer() {
  // 检查必要的环境变量
  if (!process.env.KIMI_API_KEY) {
    console.error("错误: 未设置KIMI_API_KEY环境变量");
    console.error("请设置环境变量: export KIMI_API_KEY='your-api-key'");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // 输出配置信息
  console.error("Kimi MCP Search Server running on stdio");
  console.error(`使用API端点: ${KIMI_CONFIG.client.baseURL}`);
  console.error(`使用模型: ${KIMI_CONFIG.model}`);
}

// 启动服务器
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 