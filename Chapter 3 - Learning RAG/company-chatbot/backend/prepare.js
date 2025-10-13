import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();
//   const text = "I love you";
const embeddings = new CohereEmbeddings({
  model: "embed-english-v3.0",
});
//   const vector = await embeddings.embedQuery(text);
//   console.log("Vector", vector);
//   const docs = ["I love you", "I hate you", "I like programming"];

//   const vectors = await embeddings.embedDocuments(docs);

//   console.log("Vectors", vectors[0].length); // 1024 dimensions

const pinecone = new PineconeClient();
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
});
async function indexTheDocument(filePath) {
  const loader = new PDFLoader(filePath, { splitPages: false });
  const doc = await loader.load();
  //   doc[0];
  //   console.log(doc[0].pageContent);
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const texts = await textSplitter.splitText(doc[0].pageContent);
  console.log("Number of chunks : ", texts.length);
  const documents = texts.map((chunks) => {
    return {
      pageContent: chunks,
      metadata: doc[0].metadata,
    };
  });
  console.log(documents);

  await vectorStore.addDocuments(documents);
}

export { indexTheDocument };
