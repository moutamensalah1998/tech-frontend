import { newTemplatesRoutes } from "./components/new-template-message/new-template.routes";
import { YourTemplatesComponent } from "./your-templates.component";

export const yourTemplatesRoutes = {
    path: 'your-templates',
    component: YourTemplatesComponent,
    children: [
      newTemplatesRoutes
    ]
}
