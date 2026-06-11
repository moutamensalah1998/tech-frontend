import { ChatbotComponent } from "./chatbot.component";
import { ChatbotBuilderComponent } from "./pages/chatbot-builder/chatbot-builder.component";

export const ChatbotRoutes = [
    {
        path: 'chatbot',
        component: ChatbotComponent,
    },
    {
        path: 'chatbot/builder',
        component: ChatbotBuilderComponent,
    }
];
