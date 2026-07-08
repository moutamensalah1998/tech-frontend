import { businessProfile } from "./components/business-profile/business-profile.routes";
import { tagsAndAttributesRoutes } from "./components/tags-attribute/tags-attribute.routes";
import { importExportChatsRoutes } from "./components/import-export-chats/import-export-chats.routes";
import { generalRoutes } from "./components/general/general.routes";
import { ProfileSettingsComponent } from "./profile-settings.component";
import { personalProfile } from "./components/personal-profile/personal-profile.routes";
import { userPreferencesRoutes } from "./components/user-preferences/user-preferences.routes";
import { connectWhatsappRoute } from "./components/connect-whatsapp/connect-whatsapp.routes";
import { timeAndAreaRoutes } from "./components/time-and-area/time-and-area.routes";

export const profileSettingsRoutes = {
  path: 'settings',
  component: ProfileSettingsComponent,
  children: [
    { path: '', redirectTo: 'business-profile', pathMatch: 'full' as const },
    businessProfile,
    personalProfile,
    tagsAndAttributesRoutes,
    userPreferencesRoutes,
    timeAndAreaRoutes,
    generalRoutes,
    importExportChatsRoutes,
    connectWhatsappRoute
  ]
}
