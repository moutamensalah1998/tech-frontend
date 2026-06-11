import { Routes } from '@angular/router';
import { HomeBaseComponent } from "./home-base.component";
import { AuthGuard } from '../../core/guards/auth.guard';
import { userDashboardMainRoutes } from "./pages/user-management/user-management.routes";
import { profileSettingsRoutes } from "./pages/profile-settings/profile-settings.routes";
import { broadcastRoutes } from "./pages/broadcast/broadcast.routes";
import { contactsRoutes } from "./pages/contacts/contacts.routes";
import { teamInboxRoutes } from "./pages/team-inbox/team-inbox.routes";
import { ChatbotRoutes } from "../chatbot/chatbot.routes";
import { apiDocRoutes } from "./pages/api-doc/api-doc.routes";
import { reportsRoutes } from "./pages/reports/reports.routes";

export const HomeBaseRoutes: Routes = [
  {
    path: '',
    component: HomeBaseComponent,
    children: [
      userDashboardMainRoutes,
      profileSettingsRoutes,
      broadcastRoutes,
      contactsRoutes,
      teamInboxRoutes,
      ...ChatbotRoutes,
      apiDocRoutes,
      reportsRoutes
    ],
    canActivate: [AuthGuard],
    canMatch: [AuthGuard]
  }
];
