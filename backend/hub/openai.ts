import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { openAIKey } from "./encore.service";

export interface OpenAIRequest {
  prompt: string;
  assistantId?: string;
  threadId?: string;
}

export interface OpenAIResponse {
  result: string;
  threadId: string;
}

interface OpenAIThread {
  id: string;
}

interface OpenAIMessage {
  id: string;
  role: string;
  content: Array<{
    type: string;
    text: {
      value: string;
    };
  }>;
}

interface OpenAIRun {
  id: string;
  status: string;
  last_error?: {
    code: string;
    message: string;
  };
}

interface OpenAIMessagesResponse {
  data: OpenAIMessage[];
}

const MAX_RETRIES = 3;
const POLL_INTERVAL = 1000;
const GLOBAL_TIMEOUT = 180000;

function convertUrlsToMarkdownLinks(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  
  return text.replace(urlRegex, (url) => {
    if (text.includes(`[${url}]`) || text.includes(`](${url})`)) {
      return url;
    }
    return `[${url}](${url})`;
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt: number): number {
  const baseDelay = Math.pow(2, attempt) * 1000;
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
}

function isRetriableError(error: any): boolean {
  if (error instanceof APIError) {
    return false;
  }
  
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('503') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('etimedout') ||
    errorMessage.includes('eai_again') ||
    errorMessage.includes('upstream connect error') ||
    errorMessage.includes('disconnect/reset before headers') ||
    errorCode === 'econnreset' ||
    errorCode === 'etimedout' ||
    errorCode === 'eai_again'
  );
}

async function executeAssistantRun(
  apiKey: string,
  threadId: string,
  assistantId: string,
  prompt: string,
  retryCount: number = 0
): Promise<string> {
  const startTime = Date.now();

  try {
    console.log(`[OpenAI] Attempt ${retryCount + 1}/${MAX_RETRIES} - Thread: ${threadId}`);
    
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
        "Connection": "keep-alive"
      },
      body: JSON.stringify({
        role: "user",
        content: prompt
      })
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      console.error(`[OpenAI] Failed to add message. Status: ${messageResponse.status}, Error:`, error);
      
      if (messageResponse.status === 503 && retryCount < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(retryCount);
        console.log(`[OpenAI] 503 error, retrying in ${delay}ms...`);
        await sleep(delay);
        return executeAssistantRun(apiKey, threadId, assistantId, prompt, retryCount + 1);
      }
      
      throw APIError.internal(`Failed to add message: ${error}`);
    }
    
    console.log(`[OpenAI] Message added to thread ${threadId}`);

    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
        "Connection": "keep-alive"
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error(`[OpenAI] Failed to create run. Status: ${runResponse.status}, Error:`, error);
      
      if (runResponse.status === 401) {
        throw APIError.unauthenticated("Invalid API key");
      }
      
      if (runResponse.status === 503 && retryCount < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(retryCount);
        console.log(`[OpenAI] 503 error, retrying in ${delay}ms...`);
        await sleep(delay);
        return executeAssistantRun(apiKey, threadId, assistantId, prompt, retryCount + 1);
      }
      
      throw APIError.internal(`Failed to run assistant: ${error}`);
    }
    
    const run = await runResponse.json() as OpenAIRun;
    console.log(`[OpenAI] Run created - ID: ${run.id}, Thread: ${threadId}`);

    let runStatus: OpenAIRun = run;
    let pollCount = 0;

    while (runStatus.status === "queued" || runStatus.status === "in_progress") {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime > GLOBAL_TIMEOUT) {
        console.error(`[OpenAI] Global timeout exceeded - Run: ${run.id}, Thread: ${threadId}, Elapsed: ${elapsedTime}ms`);
        throw APIError.deadlineExceeded(`A conexão com a IA expirou. Tente novamente.`);
      }

      await sleep(POLL_INTERVAL);
      pollCount++;
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
          "Connection": "keep-alive"
        }
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.text();
        console.error(`[OpenAI] Failed to check run status. Status: ${statusResponse.status}, Error:`, error);
        
        if (statusResponse.status === 503 && retryCount < MAX_RETRIES - 1) {
          const delay = getBackoffDelay(retryCount);
          console.log(`[OpenAI] 503 error on status check, retrying in ${delay}ms...`);
          await sleep(delay);
          return executeAssistantRun(apiKey, threadId, assistantId, prompt, retryCount + 1);
        }
        
        throw APIError.internal("Failed to check run status");
      }

      runStatus = await statusResponse.json() as OpenAIRun;
      console.log(`[OpenAI] Run ${run.id} status: ${runStatus.status} (poll ${pollCount}, ${elapsedTime}ms elapsed)`);
    }

    const responseTime = Date.now() - startTime;
    console.log(`[OpenAI] Run ${run.id} finished in ${responseTime}ms with status: ${runStatus.status}`);

    if (runStatus.status === "failed" || runStatus.status === "expired") {
      const errorDetails = runStatus.last_error 
        ? `${runStatus.last_error.code}: ${runStatus.last_error.message}`
        : "Unknown error";
      
      console.error(`[OpenAI] Run ${run.id} ${runStatus.status}. Error: ${errorDetails}, Thread: ${threadId}`);
      
      if (retryCount < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(retryCount);
        console.log(`[OpenAI] Retrying after ${runStatus.status} (attempt ${retryCount + 2}/${MAX_RETRIES}) in ${delay}ms`);
        await sleep(delay);
        return executeAssistantRun(apiKey, threadId, assistantId, prompt, retryCount + 1);
      }
      
      throw APIError.internal(`Não foi possível conectar à IA no momento.`);
    }

    if (runStatus.status !== "completed") {
      console.error(`[OpenAI] Run ${run.id} ended with unexpected status: ${runStatus.status}, Thread: ${threadId}`);
      throw APIError.internal(`Não foi possível conectar à IA no momento.`);
    }
    
    console.log(`[OpenAI] Run ${run.id} completed successfully, retrieving messages`);

    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
        "Connection": "keep-alive"
      }
    });

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error(`[OpenAI] Failed to retrieve messages. Status: ${messagesResponse.status}, Error:`, error);
      throw APIError.internal("Failed to retrieve messages");
    }

    const messages = await messagesResponse.json() as OpenAIMessagesResponse;
    
    const assistantMessages = messages.data.filter((msg: OpenAIMessage) => msg.role === "assistant");
    
    if (assistantMessages.length === 0) {
      console.error(`[OpenAI] No assistant messages found in thread ${threadId}`);
      throw APIError.internal("No response from assistant");
    }
    
    console.log(`[OpenAI] Retrieved ${assistantMessages.length} assistant message(s) from thread ${threadId}`);

    const latestMessage = assistantMessages[0];
    const content = latestMessage.content[0];
    
    if (content.type !== "text") {
      console.error(`[OpenAI] Unexpected content type: ${content.type}`);
      throw APIError.internal("Unexpected response format from assistant");
    }

    const rawResponse = content.text.value;
    const formattedResponse = convertUrlsToMarkdownLinks(rawResponse);
    
    console.log(`[OpenAI] Success - Response: ${formattedResponse.length} chars, Latency: ${responseTime}ms, Attempts: ${retryCount + 1}, Run: ${run.id}`);
    return formattedResponse;

  } catch (error) {
    const errorTime = Date.now() - startTime;
    
    if (error instanceof APIError) {
      console.error(`[OpenAI] APIError - ${error.message}, Latency: ${errorTime}ms, Attempts: ${retryCount + 1}, Thread: ${threadId}`);
      throw error;
    }
    
    console.error(`[OpenAI] Unexpected error:`, error, `Latency: ${errorTime}ms, Attempts: ${retryCount + 1}, Thread: ${threadId}`);
    
    if (isRetriableError(error) && retryCount < MAX_RETRIES - 1) {
      const delay = getBackoffDelay(retryCount);
      console.log(`[OpenAI] Retriable error detected, retrying in ${delay}ms (attempt ${retryCount + 2}/${MAX_RETRIES})`);
      await sleep(delay);
      return executeAssistantRun(apiKey, threadId, assistantId, prompt, retryCount + 1);
    }
    
    throw APIError.internal("Não foi possível conectar à IA no momento.");
  }
}

export const generateResponse = api<OpenAIRequest, OpenAIResponse>(
  { method: "POST", path: "/openai/generate", expose: true, auth: true },
  async ({ prompt, assistantId, threadId: providedThreadId }): Promise<OpenAIResponse> => {
    const requestStartTime = Date.now();
    let threadId = providedThreadId || "";
    
    try {
      const apiKey = openAIKey();
      
      if (!apiKey) {
        console.error("[OpenAI] API key not configured");
        throw APIError.internal("OpenAI API key not configured");
      }

      console.log(`[OpenAI] === New Request Started ===`);
      console.log(`[OpenAI] Prompt length: ${prompt.length} chars`);
      
      const actualAssistantId = assistantId || "asst_YvHPJHx201yVIH2tGefmHOYU";
      console.log(`[OpenAI] Using assistant ID: ${actualAssistantId}`);

      if (!threadId) {
        const threadResponse = await fetch("https://api.openai.com/v1/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
            "Connection": "keep-alive"
          },
          body: JSON.stringify({})
        });

        if (!threadResponse.ok) {
          const error = await threadResponse.text();
          console.error(`[OpenAI] Failed to create thread. Status: ${threadResponse.status}, Error:`, error);
          throw APIError.internal(`Failed to create thread: ${error}`);
        }
        
        const thread = await threadResponse.json() as OpenAIThread;
        threadId = thread.id;
        console.log(`[OpenAI] Thread created: ${threadId}`);
      } else {
        console.log(`[OpenAI] Reusing existing thread: ${threadId}`);
      }

      const result = await executeAssistantRun(apiKey, threadId, actualAssistantId, prompt);
      
      const totalTime = Date.now() - requestStartTime;
      console.log(`[OpenAI] === Request Completed Successfully in ${totalTime}ms ===`);

      return {
        result: result,
        threadId: threadId
      };

    } catch (error) {
      const totalTime = Date.now() - requestStartTime;
      console.error(`[OpenAI] === Request Failed after ${totalTime}ms ===`);
      console.error(`[OpenAI] Thread: ${threadId || 'N/A'}`);
      
      if (error instanceof APIError) {
        console.error(`[OpenAI] APIError: ${error.message}`);
        throw error;
      }
      
      console.error("[OpenAI] Unexpected error:", error);
      throw APIError.internal("Não foi possível conectar à IA no momento.");
    }
  }
);
