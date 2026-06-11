import { ScheduleBroadcastComponent } from "./schedule-broadcast.component";
import { NewBroadcastComponent } from "./components/new-broadcast/new-broadcast.component";

export const scheduleBroadcastRoutes = {
    path: 'scheduled-broadcasts',
    children: [
        {
            path: '',
            component: ScheduleBroadcastComponent
        },
        {
            path: 'new',
            component: NewBroadcastComponent
        }
    ]
} 