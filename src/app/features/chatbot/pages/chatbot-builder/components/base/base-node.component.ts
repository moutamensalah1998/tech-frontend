import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { DragDropService } from '../../services/drag-drop.service';
import { NodeManagementService } from '../../services/node-management.service';
import { SelectionService } from '../../services/selection.service';
import { Node } from '../../../../../../core/models/chatbot.model';

export interface NodeUIState {
  isFirstNode: boolean;
  isConnected: boolean;
  hasValidContent: boolean;
  isDragging: boolean;
  isSelected: boolean;
  validationState: 'valid' | 'warning' | 'error' | 'unknown';
  validationErrors: string[];
  validationWarnings: string[];
}

export interface NodeInteractionEvent {
  type: 'drag' | 'connection' | 'edit' | 'delete' | 'first_node_toggle';
  nodeId: string;
  data?: any;
}

@Component({
  selector: 'app-base-node',
  template: '',
})
export abstract class BaseNodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nodeContainer', { static: false }) nodeContainer?: ElementRef<HTMLElement>;

  // Core inputs
  @Input() node!: Node;
  @Input() isDragging = false;
  @Input() zoomLevel = 1;
  @Input() isSelected = false;

  // Event outputs
  @Output() onConnectionStart = new EventEmitter<MouseEvent | TouchEvent | any>();
  @Output() onAddNode = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onContentChange = new EventEmitter<void>();
  @Output() onSelectionChange = new EventEmitter<boolean>();
  @Output() onInteraction = new EventEmitter<NodeInteractionEvent>();

  // Protected subjects for cleanup
  protected destroy$ = new Subject<void>();
  protected contentChange$ = new Subject<void>();
  protected firstNodeChange$ = new Subject<boolean>();

  // UI State management
  protected uiState: NodeUIState = {
    isFirstNode: false,
    isConnected: false,
    hasValidContent: false,
    isDragging: false,
    isSelected: false,
    validationState: 'unknown',
    validationErrors: [],
    validationWarnings: []
  };

  // Drag handling properties
  private dragState = {
    isDragPending: false,
    startCoordinates: null as { x: number; y: number } | null,
    dragTimeout: null as number | null,
    threshold: 5,
    longPressDelay: 200,
  };

  // Performance optimization
  private updateScheduled = false;
  private readonly DRAG_ELEMENTS_SELECTOR = [
    '.connection-button',
    '.no-drag',
    'input',
    'textarea',
    'select',
    'button:not(.node-card)',
    '.material-icons',
    '[contenteditable]',
    '.form-field',
    '.first-node-checkbox',
  ];

  constructor(
    protected dragDropService: DragDropService,
    protected nodeManagementService: NodeManagementService,
    protected cdr: ChangeDetectorRef,
    protected selectionService?: SelectionService
  ) {
    this.setupContentChangeDebouncing();
  }

  ngOnInit(): void {
    this.setupFirstNodeListener();
    this.setupContentValidation();
    this.initializeNode();
    // Initialize state after node content is set up
    this.initializeNodeState();
  }

  ngAfterViewInit(): void {
    this.setupNodeContainerListeners();
    // Re-validate after view initialization to ensure content is properly loaded
    setTimeout(() => {
      this.updateUIState();
      this.scheduleUIUpdate();
    }, 0);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // Abstract methods that child components must implement
  protected abstract initializeNode(): void;
  protected abstract validateContent(): boolean;
  protected abstract getNodeDisplayName(): string;

  // Public API methods
  public getUIState(): NodeUIState {
    return { ...this.uiState };
  }

  public refreshState(): void {
    this.updateUIState();
    this.scheduleUIUpdate();
  }

  public focus(): void {
    this.nodeContainer?.nativeElement.focus();
    this.uiState.isSelected = true;
    this.onSelectionChange.emit(true);
    // Use selection service if available
    if (this.selectionService) {
      this.selectionService.selectNode(this.node.id, false);
    }
    this.scheduleUIUpdate();
  }

  public blur(): void {
    this.uiState.isSelected = false;
    this.onSelectionChange.emit(false);
    // Note: We don't deselect on blur to allow for multi-select scenarios
    // The selection service will handle deselection when appropriate
    this.scheduleUIUpdate();
  }

  // First node management
  public onSetAsFirst(isFirst: boolean): void {
    this.emitInteraction('first_node_toggle', { isFirst, previousState: this.uiState.isFirstNode });

    const success = this.nodeManagementService.setAsFirstNode(this.node.id, isFirst);

    if (success) {
    } else {
      this.refreshState();
    }
  }

  public get isFirstNode(): boolean {
    return this.uiState.isFirstNode;
  }

  public get isFirstNodeCheckboxDisabled(): boolean {
    // Allow all nodes to be toggled - service handles mutual exclusion
    return false;
  }

  public get firstNodeCheckboxTooltip(): string {
    if (this.isFirstNode) {
      return `This is the starting node. Users will see this ${this.getNodeType()} first when they interact with your chatbot.`;
    } else {
      return `Check to make this the starting node for your chatbot flow.`;
    }
  }

  public getNodeType(): string {
    const types = {
      'message': 'message',
      'question': 'question',
      'interactive_buttons': 'interactive buttons'
    };
    return types[this.node.type as keyof typeof types] || 'node';
  }

  // Content change handling
  protected emitContentChange(): void {
    this.contentChange$.next();
  }

  protected markContentAsValid(isValid: boolean): void {
    if (this.uiState.hasValidContent !== isValid) {
      this.uiState.hasValidContent = isValid;
      this.updateUIState();
      this.scheduleUIUpdate();
    }
  }

  protected getValidationErrorMessage(): string | null {
    // Override in child components for specific error messages
    if (!this.validateContent()) {
      return 'Please complete all required fields';
    }
    return null;
  }

  getValidationState(): 'valid' | 'warning' | 'error' | 'unknown' {
    return this.uiState.validationState;
  }

  getValidationErrors(): string[] {
    return this.uiState.validationErrors;
  }

  getValidationWarnings(): string[] {
    return this.uiState.validationWarnings;
  }

  getValidationTooltip(): string {
    const errors = this.uiState.validationErrors;
    const warnings = this.uiState.validationWarnings;

    if (errors.length > 0) {
      return `Errors: ${errors.join(', ')}`;
    }
    if (warnings.length > 0) {
      return `Warnings: ${warnings.join(', ')}`;
    }
    return 'Node is valid';
  }

  // Interaction handling
  protected canStartConnection(): boolean {
    return !this.isDragging && !this.dragState.isDragPending;
  }

  protected emitInteraction(type: NodeInteractionEvent['type'], data?: any): void {
    this.onInteraction.emit({
      type,
      nodeId: this.node.id,
      data
    });
  }

  // Drag handling
  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent): void {
    if (this.shouldPreventDrag(event.target as HTMLElement)) {
      return;
    }
    this.initiateDragSequence(event);
  }

  @HostListener('touchstart', ['$event'])
  public onTouchStart(event: TouchEvent): void {
    if (this.shouldPreventDrag(event.target as HTMLElement)) {
      return;
    }
    this.initiateDragSequence(event);
  }

  @HostListener('mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    if (this.dragState.isDragPending && this.dragState.startCoordinates) {
      this.checkDragThreshold(event.clientX, event.clientY);
    }
  }

  @HostListener('touchmove', ['$event'])
  public onTouchMove(event: TouchEvent): void {
    if (this.dragState.isDragPending && this.dragState.startCoordinates && event.touches.length > 0) {
      const touch = event.touches[0];
      this.checkDragThreshold(touch.clientX, touch.clientY);
    }
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('touchend', ['$event'])
  public onPointerUp(event: Event): void {
    if (this.dragState.isDragPending) {
      this.cancelDrag();
    }
  }

  @HostListener('contextmenu', ['$event'])
  public onContextMenu(event: Event): void {
    if (this.dragState.isDragPending) {
      event.preventDefault();
      this.cancelDrag();
    }
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    // Handle node selection
    if (!this.dragState.isDragPending && !this.isDragging) {
      this.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent): void {
    if (this.uiState.isSelected) {
      switch (event.key) {
        case 'Delete':
          event.preventDefault();
          this.onDelete.emit();
          break;
        case 'F2':
          event.preventDefault();
          this.emitInteraction('edit');
          break;
        case 'Escape':
          event.preventDefault();
          this.blur();
          break;
      }
    }
  }

  // Private methods
  private initializeNodeState(): void {
    this.updateUIState();
  }

  private updateUIState(): void {
    const isValid = this.validateContent();
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    // Collect validation errors and warnings
    if (!isValid) {
      const errorMessage = this.getValidationErrorMessage();
      if (errorMessage) {
        validationErrors.push(errorMessage);
      }
    }

    // Check for warnings (e.g., node not connected)
    if (!this.hasConnections() && !this.node.is_first) {
      validationWarnings.push('This node is not connected to the flow');
    }

    // Determine validation state
    let validationState: 'valid' | 'warning' | 'error' | 'unknown' = 'unknown';
    if (validationErrors.length > 0) {
      validationState = 'error';
    } else if (validationWarnings.length > 0) {
      validationState = 'warning';
    } else if (isValid) {
      validationState = 'valid';
    }

    this.uiState = {
      isFirstNode: this.nodeManagementService.isFirstNode(this.node.id),
      isConnected: this.hasConnections(),
      hasValidContent: isValid,
      isDragging: this.isDragging,
      isSelected: this.isSelected,
      validationState,
      validationErrors,
      validationWarnings
    };
  }

  private hasConnections(): boolean {
    const hasChildren = this.node.children && this.node.children.length > 0;
    const hasButtonConnections = this.node.buttonConnections &&
      Object.keys(this.node.buttonConnections).length > 0;
    const hasParents = this.node.parents && this.node.parents.length > 0;

    return !!(hasChildren || hasButtonConnections || hasParents);
  }

  private setupFirstNodeListener(): void {
    this.nodeManagementService.firstNodeChanged$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(firstNodeId => {
        const wasFirst = this.uiState.isFirstNode;
        const isNowFirst = firstNodeId === this.node.id;

        if (wasFirst !== isNowFirst) {
          this.uiState.isFirstNode = isNowFirst;
          this.node.is_first = isNowFirst;
          this.firstNodeChange$.next(isNowFirst);
          this.scheduleUIUpdate();
        }
      });
  }

  private setupContentValidation(): void {
    this.contentChange$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        const isValid = this.validateContent();
        this.markContentAsValid(isValid);
        this.onContentChange.emit();
      });
  }

  private setupContentChangeDebouncing(): void {
    // Debounce content changes to prevent excessive updates
    this.contentChange$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(150)
      )
      .subscribe(() => {
        this.onContentChange.emit();
      });
  }

  private setupNodeContainerListeners(): void {
    if (!this.nodeContainer) return;

    const element = this.nodeContainer.nativeElement;

    // Focus/blur events
    const focus$ = fromEvent(element, 'focusin');
    const blur$ = fromEvent(element, 'focusout');

    merge(focus$, blur$)
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: Event) => {
        if (event.type === 'focusin') {
          this.focus();
        } else {
          // Small delay to allow for focus to move within the node
          setTimeout(() => {
            if (!element.contains(document.activeElement)) {
              this.blur();
            }
          }, 10);
        }
      });
  }

  private scheduleUIUpdate(): void {
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.updateScheduled = false;
        this.cdr.markForCheck();
      });
    }
  }

  // Drag implementation
  private initiateDragSequence(event: MouseEvent | TouchEvent): void {
    const coords = this.getEventCoordinates(event);
    this.dragState.startCoordinates = { x: coords.clientX, y: coords.clientY };
    this.dragState.isDragPending = true;

    this.dragState.dragTimeout = window.setTimeout(() => {
      if (this.dragState.isDragPending) {
        this.startActualDrag(event);
      }
    }, this.dragState.longPressDelay);
  }

  private checkDragThreshold(clientX: number, clientY: number): void {
    if (!this.dragState.startCoordinates || !this.dragState.isDragPending) return;

    const deltaX = Math.abs(clientX - this.dragState.startCoordinates.x);
    const deltaY = Math.abs(clientY - this.dragState.startCoordinates.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.dragState.threshold) {
      const syntheticEvent = this.createSyntheticEvent(clientX, clientY);
      this.startActualDrag(syntheticEvent);
    }
  }

  private startActualDrag(event: MouseEvent | TouchEvent): void {
    if (!this.dragState.isDragPending) return;

    this.clearDragTimeout();
    this.dragState.isDragPending = false;
    this.dragState.startCoordinates = null;

    try {
      event.preventDefault?.();
      event.stopPropagation?.();

      this.uiState.isDragging = true;
      this.emitInteraction('drag', { startEvent: event });

      this.dragDropService.startDrag(this.node, event, this.zoomLevel);
      this.scheduleUIUpdate();
    } catch (error) {
      console.error(`Drag start error for ${this.getNodeDisplayName()}:`, error);
      this.cancelDrag();
    }
  }

  private cancelDrag(): void {
    this.clearDragTimeout();
    this.dragState.isDragPending = false;
    this.dragState.startCoordinates = null;
    this.uiState.isDragging = false;
    this.scheduleUIUpdate();
  }

  private clearDragTimeout(): void {
    if (this.dragState.dragTimeout) {
      clearTimeout(this.dragState.dragTimeout);
      this.dragState.dragTimeout = null;
    }
  }

  private shouldPreventDrag(target: HTMLElement): boolean {
    return this.DRAG_ELEMENTS_SELECTOR.some(selector => {
      return !!(target.closest(selector));
    });
  }

  private getEventCoordinates(event: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
    if (event instanceof MouseEvent) {
      return { clientX: event.clientX, clientY: event.clientY };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return touch ? { clientX: touch.clientX, clientY: touch.clientY } : { clientX: 0, clientY: 0 };
    }
  }

  private createSyntheticEvent(clientX: number, clientY: number): MouseEvent {
    return new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      button: 0
    });
  }

  private cleanup(): void {
    this.clearDragTimeout();
    this.destroy$.next();
    this.destroy$.complete();
    this.contentChange$.complete();
    this.firstNodeChange$.complete();
  }
}
