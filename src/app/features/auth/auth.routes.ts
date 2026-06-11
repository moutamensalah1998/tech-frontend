import { Routes } from '@angular/router';
import { signInRoutes } from "./components/sign-in/sign-in.routes";
import { AuthMainComponent } from "./auth-main.component";
import { Privacyroutes } from '../../shared/components/privacy-policy/privacy-policy.routes';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthMainComponent,
    children: [
      ...signInRoutes,
      ...Privacyroutes
    ]
  }
];
