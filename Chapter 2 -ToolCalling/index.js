// Import required libraries
import Groq from 'groq-sdk'; // Groq SDK for LLM/chat completions
import dotenv from 'dotenv'; // For environment variable management
import { tavily } from '@tavily/core'; // Tavily API for web search

// Load environment variables from .env file
dotenv.config();

// Initialize Tavily client with API key from environment variables
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// Initialize Groq client with API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Main function to demonstrate LLM usage with tool calling (web search)
 */
async function main() {
  // Initial messages to the chat model
  const messages = [
    {
      role: 'system',
      content: `
        You are a smart personal assistant who answers asked questions.
        You have access to the following tools:
        - webSearch({query}): {query:String} // Search latest information and real-time data on the internet.
      `,
    },
    {
      role: 'user',
      content: `When will iPhone 18 launch?`,
    },
  ];

  // Create the initial chat completion using Groq SDK
  const completions = await groq.chat.completions.create({
    messages,
    model: 'llama-3.3-70b-versatile', // Specify the LLM model
    temperature: 0, // Temperature 0 for deterministic responses
    tools: [
      {
        type: 'function',
        function: {
          name: 'webSearch',
          description:
            'Search the latest information and real-time data on the internet.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to perform the search on.',
              },
            },
            required: ['query'], // query parameter is mandatory
          },
        },
      },
    ],
    tool_choice: 'auto', // Let the model decide which tool to use
  });

  // If the model didn't call any tools, just print its response
  if (!completions.choices[0].message.tool_calls) {
    console.log(completions.choices[0].message.content);
    return;
  }

  // Add model's tool call message to the conversation
  messages.push(completions.choices[0].message);

  // Process each tool call made by the model
  for (const tool of completions.choices[0].message.tool_calls) {
    if (tool.function.name === 'webSearch') {
      // Parse tool arguments and perform the actual web search
      const response = await webSearch(JSON.parse(tool.function.arguments));

      // Add tool response to the conversation
      messages.push({
        tool_call_id: tool.id, // Link response to the tool call
        role: 'tool', // Role of this message is a tool
        name: tool.function.name, // Tool name
        content: response, // Actual search result
      });
    }
  }

  // Send the updated conversation back to the model for final response
  const toolCompletions = await groq.chat.completions.create({
    messages,
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
  });

  // Print the final assistant response after tool usage
  console.log(toolCompletions.choices[0].message.content);
}

/**
 * Web search function using Tavily API
 * @param {Object} param0 - Object containing query string
 * @returns {string} - Aggregated search results
 */
async function webSearch({ query }) {
  // Call Tavily API with the search query
  const response = await tvly.search(query);

  // Aggregate all search results into a single string
  const finalResult = response.results
    .map((result) => result.content)
    .join('\n\n');

  return finalResult;
}

// Run the main function
main();
