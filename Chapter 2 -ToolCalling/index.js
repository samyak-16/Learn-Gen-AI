import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { tavily } from '@tavily/core';

dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function webSearch({ query }) {
  const response = await tvly.search(query);
  return response.results.map((r) => r.content).join('\n\n');
}

async function main() {
  const messages = [
    {
      role: 'system',
      content: `
        You are a smart assistant with internet access via webSearch({query}).
      `,
    },
    { role: 'user', content: 'When was Iphone 17 launched ?' },
  ];

  const completions = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    messages,
    tools: [
      {
        type: 'function',
        function: {
          name: 'webSearch',
          description: 'Search the internet for real-time information.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search term' },
            },
            required: ['query'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  });

  const msg = completions.choices[0].message;
  if (!msg.tool_calls) return console.log(msg.content);

  messages.push(msg);

  for (const tool of msg.tool_calls) {
    if (tool.function.name === 'webSearch') {
      const result = await webSearch(JSON.parse(tool.function.arguments));

      messages.push({
        role: 'tool',
        tool_call_id: tool.id,
        content: result,
      });
    }
  }

  const final = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    messages,
  });

  console.log(final.choices[0].message.content);
}

main();
