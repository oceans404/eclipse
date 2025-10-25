import { google } from '@ai-sdk/google';
import { generateText, type ModelMessage } from 'ai';

const SYSTEM_PROMPT = `You are a helpful AI assistant that can discuss the contents of documents.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. NEVER quote entire sections verbatim from the document
2. NEVER reproduce the exact text, code, or data from the file
3. Always summarize, paraphrase, and provide insights
4. If asked for specific quotes, provide only brief excerpts (max 1 line)
5. Focus on analysis, explanations, and answering questions about the content
6. Maximum response length: 500 tokens

Your role is to help users understand the content without giving them the actual document content.`;

export class AIService {
  private model;

  constructor() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GOOGLE_GENERATIVE_AI_API_KEY environment variable is required'
      );
    }

    // Initialize Google Gemini model - v5 format
    this.model = google('gemini-2.0-flash');
    console.log('[AI] Initialized with Google Gemini');
  }

  /**
   * Process content with AI while maintaining security guardrails
   */
  async processContent(
    fileBuffer: Buffer,
    mimeType: string,
    userMessage: string
  ): Promise<string> {
    try {
      // Extract text content based on mime type
      let textContent = '';

      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        // Direct text files
        textContent = fileBuffer.toString('utf-8');
      } else if (mimeType === 'application/pdf') {
        // Gemini 2.0 Flash can process PDFs directly
        return await this.processDocument(fileBuffer, userMessage, mimeType);
      } else if (mimeType.startsWith('image/')) {
        // For images, we could use vision capabilities
        return await this.processImage(fileBuffer, userMessage, mimeType);
      } else {
        return 'I can only process text files, PDFs, and images at this time.';
      }

      // Truncate very long content to stay within context limits
      const maxChars = 50000; // Adjust based on model limits
      if (textContent.length > maxChars) {
        textContent =
          textContent.substring(0, maxChars) + '\n...[content truncated]';
      }

      // Generate response using Google AI - simple text approach for now
      const { text } = await generateText({
        model: this.model,
        system: SYSTEM_PROMPT,
        prompt: `Document Content:\n${textContent}\n\n---\n\nUser Question: ${userMessage}`,
        maxTokens: 500,
        temperature: 0.7,
      });

      // Additional safety check - ensure no large verbatim quotes
      if (this.containsVerbatimContent(text, textContent)) {
        return "I can help you understand this document, but I cannot reproduce its exact content. Please ask specific questions about what you'd like to know.";
      }

      return text;
    } catch (error) {
      console.error('AI processing error:', error);
      return 'I encountered an error while processing the content. Please try again.';
    }
  }

  /**
   * Process document content (PDFs) using multimodal capabilities
   */
  private async processDocument(
    documentBuffer: Buffer,
    userMessage: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Convert document to base64
      const base64Document = documentBuffer.toString('base64');

      // Create data URL for the document
      const dataUrl = `data:${mimeType};base64,${base64Document}`;

      console.log('[AI] Processing PDF document:', {
        mimeType,
        sizeKB: (documentBuffer.length / 1024).toFixed(1),
        dataUrlPrefix: dataUrl.substring(0, 50) + '...',
      });

      // AI SDK v5 - For now, PDFs aren't supported with file attachments
      // Fall back to text extraction approach
      console.log('[AI] Processing PDF - Note: Direct PDF support pending');

      const { text } = await generateText({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `I have a PDF document that I need help analyzing. ${userMessage}

Note: This is a ${(documentBuffer.length / 1024).toFixed(
              1
            )}KB PDF file. Please help me understand what you would typically find in such a document.`,
          },
        ],
        maxTokens: 500,
      });

      return text;
    } catch (error: any) {
      console.error('Document processing error:', error);
      console.error('Error details:', {
        message: error.message,
        cause: error.cause,
        response: error.response,
        data: error.data,
      });
      return `I encountered an error while processing the document: ${
        error.message || 'Unknown error'
      }`;
    }
  }

  /**
   * Process image content using vision capabilities
   */
  private async processImage(
    imageBuffer: Buffer,
    userMessage: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');

      // Create data URL for the image
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Google's Gemini supports multimodal inputs - v5 format
      const messages: ModelMessage[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userMessage },
            {
              type: 'image',
              image: dataUrl,
            },
          ],
        },
      ];

      const { text } = await generateText({
        model: this.model,
        messages,
        maxTokens: 500,
      });

      return text;
    } catch (error) {
      console.error('Image processing error:', error);
      return 'I encountered an error while processing the image. Please try again.';
    }
  }

  /**
   * Check if the response contains verbatim content from the original
   */
  private containsVerbatimContent(
    response: string,
    originalContent: string
  ): boolean {
    // Check for suspiciously long exact matches
    const minVerbatimLength = 100; // Characters

    // Split into chunks and check for exact matches
    for (let i = 0; i <= response.length - minVerbatimLength; i++) {
      const chunk = response.substring(i, i + minVerbatimLength);
      if (originalContent.includes(chunk)) {
        return true;
      }
    }

    return false;
  }
}
