# kimi-mcp

Kimi提供基于Model Context Protocol (MCP)的网络搜索功能。

## 简介

kimi-mcp是一个基于Model Context Protocol (MCP)的工具，它使用Kimi AI的网络搜索能力，通过标准输入/输出与MCP客户端通信。

## 安装

### 通过npm安装（推荐）

```bash
# 全局安装
npm install -g kimi-mcp

# 或者直接通过npx使用（无需安装）
npx kimi-mcp
```

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/qwang07/kimi-mcp.git
cd kimi-mcp

# 安装依赖
npm install

# 设置可执行权限
chmod +x index.js
```

## 配置

### 环境变量配置

kimi-mcp通过环境变量进行配置。您可以通过以下方式设置环境变量：

1. 直接在命令行中设置：

```bash
export KIMI_API_KEY="your-api-key"
export KIMI_BASE_URL="https://api.moonshot.cn/v1"
export KIMI_MODEL="moonshot-v1-32k"
export KIMI_TEMPERATURE="0.3"
export KIMI_MAX_TOKENS="32768"
export KIMI_SYSTEM_PROMPT="自定义系统提示词"
```

2. 创建.env文件（推荐）：

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑.env文件
nano .env
```

3. 通过npx使用时设置环境变量：

```bash
# 方法1：在命令行中直接设置（单次使用）
KIMI_API_KEY="your-api-key" npx kimi-mcp

# 方法2：使用.env文件（推荐）
# 在当前目录创建.env文件
echo "KIMI_API_KEY=your-api-key" > .env
echo "KIMI_BASE_URL=https://api.moonshot.cn/v1" >> .env
# 然后运行
npx kimi-mcp
```

### 必需的环境变量

- `KIMI_API_KEY`: Kimi API密钥（必需）

### 可选的环境变量

- `KIMI_BASE_URL`: Kimi API的基础URL（默认：https://api.moonshot.cn/v1）
- `KIMI_MODEL`: 使用的Kimi模型（默认：moonshot-v1-32k）
- `KIMI_TEMPERATURE`: 模型温度参数（默认：0.3）
- `KIMI_MAX_TOKENS`: 最大生成令牌数（默认：32768）
- `KIMI_SYSTEM_PROMPT`: 默认系统提示词（可被请求参数覆盖）
- `KIMI_MAX_RETRIES`: 请求失败时的最大重试次数（可选）
- `KIMI_RETRY_DELAY`: 重试之间的延迟时间（毫秒，可选）
- `KIMI_CONCURRENT_REQUESTS`: 并发请求数量限制（可选）
- `KIMI_TIMEOUT`: 请求超时时间（毫秒，可选）

## 使用方法

### 直接运行

```bash
./index.js
```

### 通过npx运行

```bash
npx kimi-mcp
```

### 测试

kimi-mcp提供了几个测试脚本来验证功能：

```bash
# 测试环境变量配置
npm run test:env

# 测试Kimi搜索功能
npm run test:search

# 测试MCP协议功能
npm run test
```

### 与MCP客户端集成

kimi-mcp实现了MCP协议，可以与任何支持MCP的客户端集成。例如，与Claude一起使用：

```
<mcp:tool name="search">
{
  "query": "最新的AI技术趋势",
  "role": "你是一位AI技术专家，请提供专业的搜索结果和分析",
  "responseFormat": "请以markdown格式返回，包含标题、链接和简短描述"
}
</mcp:tool>
```

### 与Claude桌面版集成

kimi-mcp可以与Claude桌面版集成，提供网络搜索功能：

1. 安装Claude桌面版并启用MCP功能

2. 编辑Claude配置文件（通常位于`~/Library/Application Support/Claude/claude_desktop_config.json`）：
   ```json
   {
     "globalShortcut": "",
     "mcpServers": {
       "kimi-search": {
         "command": "/path/to/kimi-mcp",
         "env": {
           "KIMI_API_KEY": "your-api-key",
           "KIMI_BASE_URL": "https://api.moonshot.cn/v1",
           "KIMI_MODEL": "moonshot-v1-32k",
           "KIMI_TEMPERATURE": "0.3",
           "KIMI_MAX_TOKENS": "32768",
           "KIMI_MAX_RETRIES": "3",
           "KIMI_RETRY_DELAY": "2000",
           "KIMI_CONCURRENT_REQUESTS": "1",
           "KIMI_TIMEOUT": "60000"
         },
         "autoStart": true,
         "description": "Kimi AI网络搜索工具"
       }
     }
   }
   ```

3. 重启Claude桌面版应用

4. 使用search工具进行网络搜索：
   ```
   <mcp:tool name="search">
   {
     "query": "最新的AI技术趋势",
     "role": "你是一位AI技术专家，请提供专业的搜索结果和分析",
     "responseFormat": "请以markdown格式返回，包含标题、链接和简短描述"
   }
   </mcp:tool>
   ```

## 支持的工具

### search

使用Kimi AI搜索网络。Kimi会根据查询内容自动执行网络搜索，并返回相关结果。

参数：
- `query`: 搜索查询内容（必需）
- `role`: Kimi的角色定义（可选，默认为系统提示词）
- `responseFormat`: 期望的返回格式（可选，默认为JSON格式）

示例：

1. 基本搜索：
```json
{
  "query": "2024年人工智能发展趋势"
}
```

2. 自定义角色和格式：
```json
{
  "query": "量子计算最新进展",
  "role": "你是一位量子物理学专家，请提供专业的学术分析",
  "responseFormat": "请以学术报告的形式返回结果，包含以下部分：\n1. 研究背景\n2. 最新突破\n3. 未来展望\n4. 参考资料"
}
```

## 默认返回格式

如果未指定`responseFormat`，kimi-mcp将使用以下JSON格式返回结果：

```json
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
```

## 错误处理

当搜索请求失败时，kimi-mcp将返回以下格式的错误信息：

```json
{
  "type": "search_error",
  "message": "<错误信息>",
  "suggestion": "你可以尝试：1. 修改搜索关键词 2. 检查API密钥是否有效 3. 调整角色描述或返回格式",
  "context": {
    "query": "<查询内容>",
    "role": "<角色定义>"
  }
}
```

## 速率限制注意事项

使用Moonshot API时，请注意以下速率限制：
- 免费账户通常有每分钟请求次数限制（RPM）
- 如果遇到`429`错误，表示已达到速率限制，需要等待一段时间后再试
- 可以通过设置`KIMI_MAX_RETRIES`和`KIMI_RETRY_DELAY`来自动处理速率限制错误
- 对于高频使用场景，建议升级到付费账户或企业版API

## 许可证

MIT
