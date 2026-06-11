import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MinimapService } from '../../services/minimap.service';
import { Node } from '../../../../../../core/models/chatbot.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-minimap',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './minimap.component.html',
  styleUrls: ['./minimap.component.css']
})
export class MinimapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() nodes: Node[] = [];
  @Input() connections: any[] = [];
  @Input() viewportBounds: { x: number; y: number; width: number; height: number } | null = null;
  @Output() jumpToPosition = new EventEmitter<{ x: number; y: number }>();

  isVisible = true;
  scale = 0.1;
  nodePositions: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
  contentBounds: { minX: number; minY: number; width: number; height: number } | null = null;
  
  // Dragging state
  isDragging = false;
  dragStartPos = { x: 0, y: 0 };
  elementStartPos = { x: 0, y: 0 };
  position = { left: 0, top: 0 }; // Position as left/top coordinates

  private destroy$ = new Subject<void>();
  private mouseMoveListener?: (e: MouseEvent) => void;
  private mouseUpListener?: (e: MouseEvent) => void;
  private resizeListener = () => this.onWindowResize();

  constructor(
    private minimapService: MinimapService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.minimapService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isVisible = state.isVisible;
        this.scale = state.scale;
        this.updateNodePositions();
        this.cdr.markForCheck();
      });
    
    // Load saved position from localStorage
    this.loadPosition();
    
    // Handle window resize to keep minimap in bounds
    window.addEventListener('resize', this.resizeListener);
  }
  
  private onWindowResize(): void {
    // Recalculate position to stay in bounds
    const minimapWidth = 200;
    const minimapHeight = 150;
    const padding = 16;
    const sidebarHeight = window.innerHeight * 0.1;
    
    this.position = {
      left: Math.max(padding, Math.min(window.innerWidth - minimapWidth - padding, this.position.left)),
      top: Math.max(sidebarHeight + padding, Math.min(window.innerHeight - minimapHeight - padding, this.position.top))
    };
    
    this.savePosition();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.cleanupDragListeners();
    window.removeEventListener('resize', this.resizeListener);
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['viewportBounds']) {
      this.updateNodePositions();
    }
  }

  private updateNodePositions(): void {
    if (this.nodes.length === 0) {
      this.nodePositions = [];
      return;
    }

    // Calculate actual bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.nodes.forEach(node => {
      const nodeWidth = node.type === 'interactive_buttons' ? 384 : 320;
      const nodeHeight = 120; // Approximate height
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add padding around the content
    const padding = 50;
    const contentWidth = maxX - minX + (padding * 2);
    const contentHeight = maxY - minY + (padding * 2);
    
    // Minimap container dimensions (accounting for padding and header)
    const minimapWidth = 200 - 16; // 200px container - 16px padding
    const minimapHeight = 150 - 40; // 150px container - 40px for header/padding
    
    // Calculate scale to fit content in minimap
    const scaleX = minimapWidth / contentWidth;
    const scaleY = minimapHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    
    // Calculate node positions relative to minimap viewport
    this.nodePositions = this.nodes.map(node => {
      const nodeWidth = node.type === 'interactive_buttons' ? 384 : 320;
      const nodeHeight = 120;
      
      return {
        id: node.id,
        x: (node.position.x - minX + padding) * scale,
        y: (node.position.y - minY + padding) * scale,
        width: nodeWidth * scale,
        height: nodeHeight * scale
      };
    });
    
    // Update scale for viewport bounds calculation
    this.scale = scale;
    this.contentBounds = {
      minX: minX - padding,
      minY: minY - padding,
      width: contentWidth,
      height: contentHeight
    };
  }

  onMinimapClick(event: MouseEvent): void {
    // Don't jump if we just finished dragging
    if (this.isDragging || !this.contentBounds) {
      return;
    }
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // Get click position relative to minimap content area
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert minimap coordinates to canvas coordinates
    const canvasX = (clickX / this.scale) + this.contentBounds.minX;
    const canvasY = (clickY / this.scale) + this.contentBounds.minY;
    
    this.jumpToPosition.emit({ x: canvasX, y: canvasY });
  }

  toggle(): void {
    this.minimapService.toggle();
  }

  onHeaderMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Only left mouse button
    
    event.preventDefault();
    event.stopPropagation();
    
    this.isDragging = true;
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    
    // Get current position of the element
    const container = (event.currentTarget as HTMLElement).closest('.minimap-container') as HTMLElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.elementStartPos = { x: rect.left, y: rect.top };
    }
    
    // Add document-level listeners for smooth dragging
    this.setupDragListeners();
    
    // Add visual feedback
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private setupDragListeners(): void {
    this.mouseMoveListener = (e: MouseEvent) => {
      if (!this.isDragging) return;
      
      e.preventDefault();
      
      // Calculate new position
      const deltaX = e.clientX - this.dragStartPos.x;
      const deltaY = e.clientY - this.dragStartPos.y;
      
      const newLeft = this.elementStartPos.x + deltaX;
      const newTop = this.elementStartPos.y + deltaY;
      
      // Constrain to viewport bounds
      const minimapWidth = 200;
      const minimapHeight = 150;
      const padding = 16;
      const sidebarHeight = window.innerHeight * 0.1; // 10vh
      
      this.position = {
        left: Math.max(padding, Math.min(window.innerWidth - minimapWidth - padding, newLeft)),
        top: Math.max(sidebarHeight + padding, Math.min(window.innerHeight - minimapHeight - padding, newTop))
      };
      
      this.cdr.markForCheck();
    };
    
    this.mouseUpListener = (e: MouseEvent) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.savePosition();
        this.cleanupDragListeners();
        
        // Reset cursor
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
  }

  private cleanupDragListeners(): void {
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
      this.mouseMoveListener = undefined;
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
      this.mouseUpListener = undefined;
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private loadPosition(): void {
    // Check if there's a saved position
    try {
      const saved = localStorage.getItem('minimap_position');
      if (saved) {
        const pos = JSON.parse(saved);
        // Only use saved position if it's valid
        if (pos.left !== undefined && pos.top !== undefined && 
            pos.left >= 0 && pos.top >= 0) {
          this.position = { left: pos.left, top: pos.top };
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load minimap position:', error);
    }
    
    // Default to top-left if no valid saved position
    this.setDefaultPosition();
  }

  private setDefaultPosition(): void {
    // Default position: top-left corner of the canvas area
    // The sidebar is at the top (10vh), so we position below it
    const padding = 16;
    
    // Calculate sidebar height (10vh = 10% of viewport height)
    const sidebarHeight = Math.floor(window.innerHeight * 0.1);
    
    // Position at top-left, just below the sidebar with some padding
    this.position = {
      left: padding,
      top: sidebarHeight + padding
    };
    
    // Don't save default position - let user drag and save their preference
    // this.savePosition();
  }

  private savePosition(): void {
    try {
      localStorage.setItem('minimap_position', JSON.stringify(this.position));
    } catch (error) {
      console.error('Failed to save minimap position:', error);
    }
  }

  getPositionStyle(): { [key: string]: string } {
    return {
      left: `${this.position.left}px`,
      top: `${this.position.top}px`,
      right: 'auto',
      bottom: 'auto'
    };
  }

  getNodeClass(nodeId: string): string {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node?.is_first) {
      return 'bg-green-500 border-green-700';
    }
    return 'bg-blue-500 border-blue-700';
  }
}

