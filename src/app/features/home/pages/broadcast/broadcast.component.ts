import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationItem, SharedSidebarComponent } from '../../../../shared/components/shared-sidebar/shared-sidebar.component';
import { selectTemplateLoading } from '../../../../core/services/broadcast/template/ngrx/your-template.selectors';
import { Store } from '@ngrx/store';
import { LoaderComponent } from "../../../../shared/components/loader/loader.component";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SharedSidebarComponent, LoaderComponent],
  templateUrl: './broadcast.component.html',
  styleUrls: ['./broadcast.component.css'],
})
export class BroadcastComponent implements OnDestroy {
  isSidebarOpen = true;
  sidebarTitle = 'broadcast.sidebar.title';
  sidebarSubtitle = 'broadcast.sidebar.subtitle';
  initialLoading = true;
  private sub: Subscription;
  loading$ = this.store.select(selectTemplateLoading);

  constructor(private store: Store) {
    this.sub = this.store.select(selectTemplateLoading).subscribe(loading => {
      // Keep loader visible until we explicitly get `false`
      this.initialLoading = loading;
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  navItems: NavigationItem[] = [
    {
      label: 'broadcast.sidebar.templateMessages',
      icon: '📄',
      routerLink: 'your-templates',
      exact: false,
      translateLabel: true
    },
    {
      label: 'broadcast.sidebar.scheduledBroadcasts',
      icon: '⏰',
      routerLink: 'scheduled-broadcasts',
      exact: false,
      translateLabel: true
    }
  ];
}
