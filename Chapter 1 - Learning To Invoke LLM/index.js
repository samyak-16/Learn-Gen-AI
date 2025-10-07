import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completions = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are Jarvis a smart personal assistant , trained to generate smart quizes . ',
      },
      {
        role: 'user',
        content: `Hey jarvis , can you generate some quiz questions realatest to systemDesign with 4 options  ? the output must be strictly in this object format  :  {

        'question' : 'Which of the following  is related to  fanOut archetructure ? ',
        'options' : ['option1','option2','option3'...],
        'answer' : {
                index : "Index of the answer from options array" ,
                answer : "The correct answer in text from the option array"

        }
        } `,
      },
    ],
    model: 'openai/gpt-oss-20b',
  });
  console.log(completions.choices[0].message.content);
}
main();
