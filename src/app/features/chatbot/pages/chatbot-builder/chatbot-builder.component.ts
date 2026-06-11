import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntil, Subject } from 'rxjs';

import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CanvasContainerComponent } from './components/canvas-container/canvas-container.component';
import { AddNodeMenuComponent } from './components/add-node-menu/add-node-menu.component';
import { LoadingOverlayComponent } from '../../../home/pages/broadcast/components/your-templates/components/new-template-message/components/loading-overlay/loading-overlay.component';
import { ShortcutsHelpComponent } from './components/shortcuts-help/shortcuts-help.component';
import { NodeSearchComponent } from './components/node-search/node-search.component';
import { MinimapComponent } from './components/minimap/minimap.component';

import { ChatbotData, Node } from '../../../../core/models/chatbot.model';
import { Connection, ConnectionService } from './services/connection.service';
import { NodeManagementService } from './services/node-management.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { getChatbotFlow, updateChatbotFlowNodesError, updateChatbotFlowNodesSuccess } from '../../../../core/services/chatbot/ngrx/chatbot.actions';
import { selectChatbotData, selectChatbotLoading } from '../../../../core/services/chatbot/ngrx/chatbot.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { ToastService } from '../../../../core/services/toast-message.service';
import { LocalAutoSaveService } from './services/local-auto-save.service';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts.service';
import { UndoRedoService } from './services/undo-redo.service';
import { GridSnapService } from './services/grid-snap.service';
import { MinimapService } from './services/minimap.service';
import { CanvasPanningService } from './services/canvas-panning.service';
import { ViewportService } from './services/viewport.service';
import { ProgressService } from './services/progress.service';
import { FlowLoaderService } from './services/flow-loader.service';
import { ConnectionPreviewService } from './services/connection-preview.service';
import { BuilderStateService } from './services/builder-state.service';
import { BuilderActionsService } from './services/builder-actions.service';
import { UIHelpersService } from './services/ui-helpers.service';
import { NODE_CONSTANTS } from './constants/node.constants';
import { BUILDER_CONSTANTS } from './constants/builder.constants';
import { ZoomConfig } from './interface/node.interfaces';
import { ChatbotFlowResponse } from './models/api-response.model';

@Component({
  selector: 'app-chatbot-builder',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ToolbarComponent,
    CanvasContainerComponent,
    AddNodeMenuComponent,
    LoadingOverlayComponent,
    ShortcutsHelpComponent,
    NodeSearchComponent,
    MinimapComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chatbot-builder.component.html',
  styleUrls: ['./chatbot-builder.component.scss'],
})
export class ChatbotBuilderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(CanvasContainerComponent, { static: true })
  canvasContainer!: CanvasContainerComponent;

  @Input() chatbotMetaData!: ChatbotData;

  // State from services
  nodes$ = this.builderState.nodes$;
  connections$ = this.builderState.connections$;
  zoomConfig$ = this.builderState.zoomConfig$;
  isPanning$ = this.builderState.isPanning$;
  isDragging$ = this.builderState.isDragging$;
  draggedNodeId$ = this.builderState.draggedNodeId$;
  selectedNodeIds$ = this.builderState.selectedNodeIds$;

  // Local state
  nodes: Node[] = [];
  connections: Connection[] = [];
  zoomConfig: ZoomConfig = {
    level: 1,
    min: NODE_CONSTANTS.ZOOM.MIN,
    max: NODE_CONSTANTS.ZOOM.MAX,
    step: NODE_CONSTANTS.ZOOM.STEP,
  };
  isPanning = false;
  isDragging = false;
  draggedNodeId: string | null = null;
  showAddMenu = false;
  selectedNode: Node | null = null;
  selectedConnection: Connection | null = null;
  showShortcutsHelp = false;
  undoRedoState = {
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0
  };
  gridConfig = {
    enabled: false,
    size: 20,
    showGrid: false
  };
  viewportBounds: { x: number; y: number; width: number; height: number } | null = null;
  connectionDeleteButton: { x: number; y: number } | null = null;
  connectionPreviewLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  chatbotId: string | null = null;
  chatbotName: string | null = null;
  chatbotLanguage: string | null = null;
  chatbotVersion: number | null = null;
  isLoadingFlow = false;
  isSubmittingFlow = false;
  submitProgress = this.progressService.getProgressState();

  nodeOptions = [...BUILDER_CONSTANTS.NODE_OPTIONS];

  private destroy$ = new Subject<void>();
  private panCleanup?: () => void;

  constructor(
    private nodeService: NodeManagementService,
    private connectionService: ConnectionService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private store: Store,
    private toastService: ToastService,
    private actions$: Actions,
    private shortcutsService: KeyboardShortcutsService,
    private autoSaveService: LocalAutoSaveService,
    private undoRedoService: UndoRedoService,
        private gridSnapService: GridSnapService,
        private minimapService: MinimapService,
        private panningService: CanvasPanningService,
    private viewportService: ViewportService,
    private progressService: ProgressService,
    private flowLoader: FlowLoaderService,
    private connectionPreview: ConnectionPreviewService,
    private builderState: BuilderStateService,
    private builderActions: BuilderActionsService,
    private uiHelpers: UIHelpersService
  ) {}

  ngOnInit(): void {
    this.initializeRouteParams();
    this.setupSubscriptions();
    this.setupStoreSubscriptions();
        this.setupKeyboardShortcuts();
        this.setupUndoRedo();
        this.setupGridSnapping();
        this.setupSearchNodeSelection();
    this.setupProgressTracking();
  }

  ngAfterViewInit(): void {
    this.initializeCanvasPanning();
    this.initializeViewport();
    this.initializeConnectionPreview();
  }

  ngOnDestroy(): void {
    this.panCleanup?.();
    this.viewportService.cleanup(this.canvasContainer?.gridContainer?.nativeElement);
    this.shortcutsService.cleanup();
    window.removeEventListener('search-node-select', this.handleSearchNodeSelect as EventListener);
    this.autoSaveService.disableAutoSave();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialization methods
  private initializeRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.chatbotId = params['id'];
      this.chatbotName = params['name'];
      this.chatbotLanguage = params['language'];
      this.chatbotVersion = params['version'] ? +params['version'] : null;

      if (this.chatbotId) {
        this.loadChatbotFlow();
        this.autoSaveService.enableAutoSave(this.chatbotId);
        this.checkForAutoSavedData();
      } else {
        this.showAddMenu = true;
      }
    });
  }

  private initializeCanvasPanning(): void {
    if (this.canvasContainer?.gridContainer) {
      this.panCleanup = this.panningService.initializePanning(
        this.canvasContainer.gridContainer.nativeElement,
        (e) => this.uiHelpers.isClickingOnEmptySpace(e),
        (el) => this.uiHelpers.isUIElement(el),
        (isPanning) => {
          this.isPanning = isPanning;
          this.cdr.markForCheck();
        }
      );
    }
  }

  private initializeViewport(): void {
    if (this.canvasContainer?.gridContainer) {
      this.viewportService.initialize(
        this.canvasContainer.gridContainer.nativeElement,
        (bounds) => {
          this.viewportBounds = bounds;
          this.minimapService.setViewportBounds(bounds);
          this.cdr.markForCheck();
        }
      );
    }
  }

  private initializeConnectionPreview(): void {
    if (this.canvasContainer?.gridContainer) {
      this.connectionPreview.initialize(
        this.canvasContainer.gridContainer,
        this.zoomConfig,
        (targetElement) => this.handleConnectionEnd(targetElement)
      );
    }
  }

  // Setup methods
  private setupSubscriptions(): void {
    this.builderState.nodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nodes) => {
        this.nodes = nodes;
        this.updateConnections();
        if (nodes.length > 0 && this.undoRedoService.getCurrentState().undoCount === 0) {
          this.undoRedoService.saveState();
        }
        this.cdr.markForCheck();
      });

    this.builderState.connections$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connections) => {
        this.connections = connections;
        this.cdr.markForCheck();
      });

    this.builderState.zoomConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        this.zoomConfig = config;
        if (this.canvasContainer?.gridContainer) {
          this.connectionPreview.initialize(
            this.canvasContainer.gridContainer,
            config,
            (targetElement) => this.handleConnectionEnd(targetElement)
          );
        }
        this.cdr.markForCheck();
      });

    this.builderState.isPanning$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isPanning) => {
        this.isPanning = isPanning;
        this.cdr.markForCheck();
      });

    this.builderState.isDragging$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDragging) => {
        this.isDragging = isDragging;
        if (isDragging) {
          this.updateConnections();
        }
        this.cdr.markForCheck();
      });

    this.builderState.draggedNodeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((draggedNodeId) => {
        this.draggedNodeId = draggedNodeId;
        this.cdr.markForCheck();
      });

    this.connectionPreview.previewLine$
      .pipe(takeUntil(this.destroy$))
      .subscribe((previewLine) => {
        this.connectionPreviewLine = previewLine;
        this.cdr.markForCheck();
      });
  }

  private setupStoreSubscriptions(): void {
    this.store.select(selectChatbotLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoadingFlow = loading;
        this.cdr.markForCheck();
      });

    this.store.select(selectChatbotData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async data => {
        if (data && data.nodes) {
          await this.loadFlowFromApiResponse(data as ChatbotFlowResponse);
        }
      });
  }

  private setupKeyboardShortcuts(): void {
    this.shortcutsService.setupListeners();
    this.shortcutsService.shortcut$
      .pipe(takeUntil(this.destroy$))
      .subscribe(shortcutEvent => {
        this.handleShortcut(shortcutEvent.action, shortcutEvent.event);
      });
  }

  private setupUndoRedo(): void {
    // Subscribe to undo/redo state changes
    this.undoRedoService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.undoRedoState = state;
        this.cdr.markForCheck();
      });

    // Save state when nodes change (debounced to avoid too many saves)
    // But skip saving if we're in the middle of an undo/redo operation
    this.nodeService.nodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Use a debounce to avoid saving state too frequently
        // This ensures we only save after operations complete
        setTimeout(() => {
          // Check if undo/redo is executing - if so, don't save state
          // The undo/redo service has an isExecuting flag that saveState checks
          this.undoRedoService.saveState();
        }, 300);
      });
  }

  private setupGridSnapping(): void {
    this.gridSnapService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.gridConfig = config;
        this.cdr.markForCheck();
      });
  }

  private setupSearchNodeSelection(): void {
    window.addEventListener('search-node-select', this.handleSearchNodeSelect as EventListener);
  }

  private setupProgressTracking(): void {
    this.store.select(selectChatbotLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isSubmittingFlow = loading;
        if (loading) {
          this.progressService.startProgress();
        } else {
          this.progressService.reset();
        }
        this.submitProgress = this.progressService.getProgressState();
        this.cdr.markForCheck();
      });

    this.actions$.pipe(
      ofType(updateChatbotFlowNodesSuccess, updateChatbotFlowNodesError),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.isSubmittingFlow = false;
      this.progressService.reset();
      this.submitProgress = this.progressService.getProgressState();

      if (action.type === updateChatbotFlowNodesError.type) {
        this.toastService.showToast('Failed to save flow. Please try again.', 'error');
      }

      this.cdr.markForCheck();
    });

    this.progressService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.submitProgress = progress;
        this.cdr.markForCheck();
      });
  }

  // Event handlers
  private handleSearchNodeSelect = (event: CustomEvent) => {
    const nodeId = event.detail?.nodeId;
    if (nodeId) {
      this.onSearchResultClick(nodeId);
    }
  };

  private handleShortcut(action: string, event: KeyboardEvent): void {
    // Prevent default browser behavior for undo/redo shortcuts
    if (action === 'undo' || action === 'redo') {
      event.preventDefault();
      event.stopPropagation();
    }

    const gridContainerRef = this.canvasContainer?.gridContainer;
    if (!gridContainerRef && action !== 'undo' && action !== 'redo') {
      // Allow undo/redo even if gridContainer is not ready
      return;
    }

    this.builderActions.handleShortcut(
      action,
      this.nodes,
      this.zoomConfig,
      gridContainerRef!,
      {
        showAddMenu: () => {
          this.showAddMenu = true;
          this.cdr.markForCheck();
        },
        closeAddMenu: () => this.closeAddMenu(),
        clearConnectionSelection: () => this.clearConnectionSelection(),
        showShortcutsHelp: (show) => {
          this.showShortcutsHelp = show;
          this.cdr.markForCheck();
        },
        undo: () => this.undo(),
        redo: () => this.redo()
      }
    );
    this.cdr.markForCheck();
  }

  // Flow loading
  private loadChatbotFlow(): void {
    if (!this.chatbotId) return;
    this.store.dispatch(getChatbotFlow({ chatbotId: this.chatbotId }));
  }

  private async loadFlowFromApiResponse(flowResponse: ChatbotFlowResponse): Promise<void> {
    this.flowLoader.loadFlowFromApi(flowResponse).subscribe({
      next: (result) => {
        this.nodeService.loadNodes(result.nodes);
        if (result.chatbotInfo) {
          this.chatbotName = result.chatbotInfo.name;
          this.chatbotLanguage = result.chatbotInfo.language;
          this.chatbotVersion = result.chatbotInfo.version;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.showToast('Failed to load chatbot flow', 'error');
      }
    });
  }

  // Node operations
  onAddNodeOption(option: any): void {
    if (option && option.type) {
      const position = this.builderActions.calculateNewNodePosition(this.nodes, this.selectedNode);
      const newNode = this.nodeService.addNode(option.type, position);
      setTimeout(() => {
        const nodeElement = document.querySelector(`[data-node-id="${newNode.id}"]`) as HTMLElement;
        if (nodeElement) {
          nodeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }, 100);
      this.closeAddMenu();
      this.cdr.markForCheck();
    }
  }

  onNodeDelete(node: Node): void {
    const allConnections = this.connectionService.getAllConnections(this.nodes);
    const connectionsToDelete = allConnections.filter(
      (conn) => conn.from.id === node.id || conn.to.id === node.id
    );
    connectionsToDelete.forEach((conn) => {
      try {
        this.connectionService.deleteConnection(conn.from, conn.to, conn.buttonIndex);
      } catch (error) {
        // Ignore errors
      }
    });

    this.nodeService.deleteNode(node.id);
    this.closeAddMenu();
    this.cdr.markForCheck();
  }

  onNodeContentChange(): void {
    this.updateConnections();
  }

  // Connection operations
  onConnectionStart(event: { node: Node; event: MouseEvent | TouchEvent | any }): void {
    const { node: sourceNode, event: originalEvent } = event;

    if (originalEvent && typeof originalEvent.stopPropagation === 'function') {
      originalEvent.stopPropagation();
      originalEvent.preventDefault();
    }

    const isButtonConnection = originalEvent &&
      typeof originalEvent === 'object' &&
      'buttonIndex' in originalEvent &&
      originalEvent.buttonIndex !== undefined;

    const buttonIndex = isButtonConnection ? originalEvent.buttonIndex : undefined;
    const buttonId = isButtonConnection ? originalEvent.buttonId : undefined;

    this.connectionPreview.startConnection(sourceNode, buttonIndex, buttonId);
    this.cdr.markForCheck();
  }

  onConnectionClick(connection: Connection, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedConnection = connection;
    this.positionConnectionDeleteButton(connection);
    this.cdr.markForCheck();
  }

  onConnectionDelete(): void {
    if (this.selectedConnection) {
      this.connectionService.deleteConnection(
        this.selectedConnection.from,
        this.selectedConnection.to,
        this.selectedConnection.buttonIndex
      );
      this.clearConnectionSelection();
      this.updateConnections();
    }
  }

  handleConnectionEnd(targetElement: HTMLElement): void {
    const source = this.connectionPreview.getConnectionSource();
    if (!source.node) {
      this.connectionPreview.endConnection();
      return;
    }

    const targetCard = targetElement.closest('.node-container');
    if (targetCard) {
      const targetNodeId = targetCard.getAttribute('data-node-id');
      const targetNode = this.nodeService.findNodeById(targetNodeId!);
      if (targetNode && targetNode !== source.node) {
        const success = this.connectionService.createConnection(
          source.node,
          targetNode,
          source.buttonIndex,
          source.buttonId
        );
        if (success) {
          this.updateConnections();
        }
      }
    }

    this.connectionPreview.endConnection();
  }

  // UI helpers
  private updateConnections(): void {
    this.connections = this.connectionService.getAllConnections(this.nodes);
    this.cdr.markForCheck();
  }

  private positionConnectionDeleteButton(connection: Connection): void {
    const fromPos = this.connectionService.getConnectionPoint(connection.from);
    const toPos = {
      x: connection.to.position.x,
      y: connection.to.position.y + 60,
    };

    if (fromPos && toPos) {
      this.connectionDeleteButton = {
        x: (fromPos.x + toPos.x) / 2,
        y: (fromPos.y + toPos.y) / 2,
      };
    }
  }

  private clearConnectionSelection(): void {
    this.selectedConnection = null;
    this.connectionDeleteButton = null;
    this.cdr.markForCheck();
  }


  // Public methods for template
  openAddMenu(node?: Node): void {
    this.showAddMenu = true;
    this.selectedNode = node || null;
    this.cdr.markForCheck();
  }

  closeAddMenu(): void {
    this.showAddMenu = false;
    this.selectedNode = null;
    this.cdr.markForCheck();
  }

  toggleAddMenu(): void {
    this.showAddMenu = !this.showAddMenu;
    if (!this.showAddMenu) {
      this.selectedNode = null;
    }
    this.cdr.markForCheck();
  }

  onAddNodeButtonClick(event: Event): void {
    event.stopPropagation();
    this.toggleAddMenu();
  }

  onZoomChange(newLevel: number): void {
    this.builderState.updateZoom(newLevel);
  }

  undo(): void {
    if (!this.undoRedoState.canUndo) {
      return; // Button should be disabled, but double-check
    }

    const success = this.undoRedoService.undo();
    if (success) {
      // Update connections after undo
      this.updateConnections();
      // State will be updated via subscription, but force check
      this.cdr.markForCheck();
      // Toast notification is optional - can be removed if too noisy
      // this.toastService.showToast('Undone', 'success');
    }
  }

  redo(): void {
    if (!this.undoRedoState.canRedo) {
      return; // Button should be disabled, but double-check
    }

    const success = this.undoRedoService.redo();
    if (success) {
      // Update connections after redo
      this.updateConnections();
      // Force change detection to update UI
      this.cdr.detectChanges();
    } else {
      // If redo failed, update state anyway to refresh button states
      this.cdr.markForCheck();
    }
  }

  toggleGridSnapping(): void {
    this.gridSnapService.toggle();
  }

  hideConnectionButtons(event?: Event): void {
    if (!this.isPanning && event) {
      const target = event.target as HTMLElement;
      const isToolbarClick = target.closest('.toolbar');
      const isAddMenuClick = target.closest('app-add-node-menu');
      const isAddNodeButtonClick = target.closest('[title="Add new node"]') ||
        target.closest('button') && target.textContent?.includes('Add Node');
      const isZoomControlsClick = target.closest('app-zoom-controls');
      const isSidebarClick = target.closest('app-sidebar');
      const isEmptyCanvasClick = this.uiHelpers.isClickingOnEmptySpace(event as MouseEvent);

      if (!isToolbarClick && !isAddMenuClick && !isAddNodeButtonClick &&
        !isZoomControlsClick && !isSidebarClick && isEmptyCanvasClick) {
        event.stopPropagation();
        this.clearConnectionSelection();
        this.closeAddMenu();
      }
    }
  }

  onSearchResultClick(nodeId: string): void {
    this.uiHelpers.scrollToNode(nodeId);
  }

  onMinimapJump(position: { x: number; y: number }): void {
    if (this.canvasContainer?.gridContainer) {
      const container = this.canvasContainer.gridContainer.nativeElement;
      container.scrollTo({
        left: position.x,
        top: position.y,
        behavior: 'smooth'
      });
    }
  }

  onCloseShortcutsHelp(): void {
    this.showShortcutsHelp = false;
    this.cdr.markForCheck();
  }

  onCancelSubmission(): void {
    this.toastService.showToast('Cannot cancel submission in progress', 'info');
  }

  // Getters for template
  getFirstNodeTitle(): string | null {
    return this.builderState.getFirstNodeTitle();
  }

  isNodeFirst(nodeId: string): boolean {
    return this.builderState.isNodeFirst(nodeId);
  }

  get isAnyOperationInProgress(): boolean {
    return this.isSubmittingFlow || this.isLoadingFlow;
  }

  private checkForAutoSavedData(): void {
    if (!this.chatbotId) return;

    const autoSavedData = this.autoSaveService.getAutoSavedData(this.chatbotId);
    if (autoSavedData && autoSavedData.nodes) {
      const shouldRestore = confirm(
        'Auto-saved data found. Would you like to restore it?\n\n' +
        'Click OK to restore auto-saved data, or Cancel to continue with current flow.'
      );

      if (shouldRestore) {
        this.toastService.showToast('Auto-saved data restored', 'success');
      }
    }
  }
}

