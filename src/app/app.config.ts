import { socketReducer } from './core/services/chat/ngrx/socket.reducer';
import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { authReducer } from './core/services/auth/ngrx/auth.reducer';
import { AuthEffects } from './core/services/auth/ngrx/auth.effect';
import { adminAuthReducer } from './core/services/auth/admin-ngrx/admin-auth.reducer';
import { AdminAuthEffects } from './core/services/auth/admin-ngrx/admin-auth.effects';
import { AuthInterceptor } from './core/api/interceptor.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { userManagementReducer } from './core/services/user-management/ngrx/user-management.reducer';
import { UserManagementEffects } from './core/services/user-management/ngrx/user-management.effects';
import { profileSettingsBusinessProfileReducer } from './core/services/profile-settings/ngrx/profile-settings.reducer';
import { ProfileSettingsEffects } from './core/services/profile-settings/ngrx/profile-settings.effects';
import { templateReducer } from './core/services/broadcast/template/ngrx/your-template.reducer';
import { TemplateEffects } from './core/services/broadcast/template/ngrx/your-template.effects';
import { scheduledBroadcastReducer } from './core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.reducer';
import { ScheduledBroadcastEffects } from './core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.effects';
import { tagReducer } from './core/services/tags/ngrx/tags.reducer';
import { contactReducer } from './core/services/contact/ngrx/contact.reducer';
import { ContactEffects } from './core/services/contact/ngrx/contact.effects';
import { AttributesEffects } from './core/services/attributes/ngrx/attributes.effects';
import { attributeReducer } from './core/services/attributes/ngrx/attributes.reducer';
import { MessagesEffects } from './core/services/messages/ngrx/messages.effects';
import { messageReducer } from './core/services/messages/ngrx/messages.reducer';
import { conversationsReducer } from './core/services/conversations/ngrx/conversations.reducer';
import { ConversationsEffects } from './core/services/conversations/ngrx/conversations.effects';
import { TagsEffects } from './core/services/tags/ngrx/tags.effects';
import { SocketEffects } from './core/services/chat/ngrx/socket.effects';
import { ChatbotEffects } from './core/services/chatbot/ngrx/chatbot.effects';
import { chatbotReducer } from './core/services/chatbot/ngrx/chatbot.reducer';
import { UploadMediaEffects } from './core/services/upload-media/ngrx/meida.effects';
import { uploadMediaReducer } from './core/services/upload-media/ngrx/meida.reducer';
import { apiDocReducer } from './core/services/api-doc/ngrx/api-doc.reducer';
import { ApiDocEffects } from './core/services/api-doc/ngrx/api-doc.effects';
import { reportsReducer } from './core/services/reports/ngrx/reports.reducer';
import { ReportsEffects } from './core/services/reports/ngrx/reports.effects';
import { whatsappIntegrationReducer } from './core/services/whatsapp-integration/ngrx/whatsapp-integration.reducer';
import { WhatsappIntegrationEffects } from './core/services/whatsapp-integration/ngrx/whatsapp-integration.effects';


export const appConfig: ApplicationConfig = {
  providers: [

    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore({
      auth: authReducer,
      adminAuth: adminAuthReducer,
      userManagement: userManagementReducer,
      BusinessProfileSettings: profileSettingsBusinessProfileReducer,
      whatsappTemplates: templateReducer,
      scheduledBroadcast: scheduledBroadcastReducer,
      TagSettings: tagReducer,
      AttributesSettings: attributeReducer,
      contacts: contactReducer,
      messages: messageReducer,
      conversations: conversationsReducer,
      socket: socketReducer,
      chatbot: chatbotReducer,
      uploadMedia: uploadMediaReducer,
      apiDoc: apiDocReducer,
      reports: reportsReducer,
      whatsappIntegration: whatsappIntegrationReducer
    }),
    provideEffects([
      AuthEffects,
      AdminAuthEffects,
      UserManagementEffects,
      ProfileSettingsEffects,
      TemplateEffects,
      ScheduledBroadcastEffects,
      ContactEffects,
      AttributesEffects,
      MessagesEffects,
      ConversationsEffects,
      TagsEffects,
      SocketEffects,
      ChatbotEffects,
      UploadMediaEffects,
      ApiDocEffects,
      ReportsEffects,
      WhatsappIntegrationEffects
    ]),
    provideAnimationsAsync(),
  ],
};
