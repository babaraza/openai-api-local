# AI Local 
This is a `localhost` implementation of the `Open AI API`. This will allow the user to interface with the API locally without having to host the file in the cloud. This is not a chat interface rather a quick option to interface with the API.

Another benefit of using APIs is that the prompts/responses are **not** used to train the models (see below)

| API | Used to train models | 
| --- | -------------------- | 
| OpenAI | No (as per privacy docs) |
| Gemini | Yes |
| Claude | Unknown |

## Features
- Supports creating images using DALL-E 3
  - shows the revised prompt that OpenAI API generates
- Allows the user to monitor daily cost for OpenAI API usage
- Markdown support in responses
- Supports `<code>` blocks
  -  language specific highlighting
  - `copy` button to copy code
- Supports dark mode

## Usage
- Edit the `script.js` file 
  - Add your OpenAI API key in `const OPENAI_API_KEY`
  - Add your Google Gemini API Key in `const GEMINI_API_KEY`

### OpenAI
Currently supported API endpoints are:
- GPT-4 Omni
- GPT-3.5 Turbo
- DALL-E 3
- GPT-4 Vision Preview
- TTS-1 (text-to-speech)

## Planned features
- [x] Add support for Gemini by Google 
- [ ] Better error handling
- [ ] Add chat feature
- [ ] Add support for streaming
- [ ] Add web search support
- [ ] Allow more api parameters to be configured for each `endpoint`
- [ ] Add support for OpenAI `speech-to-text`
- [ ] Add support for Claude by Anthropic (currently has issue with CORS)
- [ ] Implement tokenizer to display token count for prompt
- [ ] Add cost calculator for Gemini and Claude