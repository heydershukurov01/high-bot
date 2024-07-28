const OpenAI = require('openai');

class AiModel {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
        });
    }
    async getChatGPTResponse(prompt) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: `Cümləyə əsasən JSON formatı yaradın:
{ 
isElectrician: boolean,
isTrading: boolean,
isEngineMaster: boolean,
isAdv: boolean
}
Qaydalar:
isElectrician - Avtomobil elektrik işləri
isTrading - Avtomobil detallarını axtarmaq
isEngineMaster - Avtomobil mühərrik problemi
isAdv - Reklam etmək
JSON formatını qaytarın və əlavə heç nə yazmayın` }, {role: 'user' , content: prompt}],
            });
            console.log(response);
            return this.extractJson(response?.choices[0]?.message?.content);
        } catch (error) {
            console.error('Error getting response from OpenAI:', error);
            return false;
        }
    }
    extractJson(response) {
        function extractJsonString(str) {
            const jsonStart = str.indexOf('{');
            const jsonEnd = str.lastIndexOf('}') + 1;

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('JSON string not found');
            }

            const jsonString = str.substring(jsonStart, jsonEnd);
            return jsonString;
        }

// JSON stringini parse edib obyektə çevirmək üçün funksiya
        function parseJsonString(jsonString) {
            try {
                const jsonObject = JSON.parse(jsonString);
                return jsonObject;
            } catch (error) {
                throw new Error('Error parsing JSON string: ' + error.message);
            }
        }

        try {
            const jsonString = extractJsonString(response);
            console.log('Extracted JSON String:', jsonString);

            const jsonObject = parseJsonString(jsonString);
            console.log('Parsed JSON Object:', jsonObject);
            return jsonObject;
        } catch (error) {
            console.error(error.message);
            return false;
        }
    }
}
const ai = new AiModel();
module.exports = ai;