import { Routes } from '@angular/router';
import { MainComponent } from './features/landing/landing.component';
import { RedirectGuard } from './core/guards/redirect.guard';
import { TermsAndConditionComponent } from './shared/components/terms-and-condition/terms-and-condition.component';
import { ExplainDeleteAccountComponent } from './shared/components/explain-delete-account/explain-delete-account.component';
import { MetaCallbackComponent } from './features/home/pages/meta-callback/meta-callback.component';
import { AdminLoginComponent } from './features/auth/components/admin-login/admin-login.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [RedirectGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/home/home-base.routes').then(m => m.HomeBaseRoutes)
  },
  {
    path: 'admin-login',
    component: AdminLoginComponent
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent
  },

  { path: 'terms-and-condition', component: TermsAndConditionComponent },

  { path: 'delete-data', component: ExplainDeleteAccountComponent },

  { path: 'meta/callback', component: MetaCallbackComponent },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
