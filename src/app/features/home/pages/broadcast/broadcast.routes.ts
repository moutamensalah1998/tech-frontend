import { BroadcastComponent } from "./broadcast.component";
import { newTemplatesRoutes } from "./components/your-templates/components/new-template-message/new-template.routes";
import { yourTemplatesRoutes } from "./components/your-templates/your-templates.routes";
import { scheduleBroadcastRoutes } from "./components/schedule-broadcast/schedule-broadcast.routes";

export const broadcastRoutes = {
    path: 'broadcast',
    component: BroadcastComponent,
    children:[
      yourTemplatesRoutes,
      scheduleBroadcastRoutes,
    ]
}
