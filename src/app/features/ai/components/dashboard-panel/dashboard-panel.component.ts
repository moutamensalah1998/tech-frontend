import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AISettings, AIStats } from '../../models/ai-config.model';

@Component({
  selector: 'app-dashboard-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-panel.component.html',
  styleUrls: ['./dashboard-panel.component.css']
})
export class DashboardPanelComponent {
  @Input() settings: AISettings | null = null;
  @Input() stats: AIStats | null = null;
  @Input() onToggleAI: (enabled: boolean) => void = () => {};
  @Input() isLoading: boolean = false;
}