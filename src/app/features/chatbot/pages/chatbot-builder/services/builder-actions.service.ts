import { Injectable, ElementRef } from '@angular/core';
import { Node } from '../../../../../core/models/chatbot.model';
import { ConnectionService } from './connection.service';
import { NodeManagementService } from './node-management.service';
import { ClipboardService } from './clipboard.service';
import { SelectionService } from './selection.service';
import { GridSnapService } from './grid-snap.service';
import { NodeSearchService } from './node-search.service';
import { ToastService } from '../../../../../core/services/toast-message.service';
import { ZoomConfig } from '../interface/node.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BuilderActionsService {
  constructor(
    private nodeService: NodeManagementService,
    private connectionService: ConnectionService,
    private clipboardService: ClipboardService,
    private selectionService: SelectionService,
    private gridSnapService: GridSnapService,
    private searchService: NodeSearchService,
    private toastService: ToastService
  ) {}

  /**
   * Handle keyboard shortcut actions
   */
  handleShortcut(
    action: string,
    nodes: Node[],
    zoomConfig: ZoomConfig,
    gridContainer: ElementRef<HTMLElement>,
    callbacks: {
      showAddMenu?: () => void;
      closeAddMenu?: () => void;
      clearConnectionSelection?: () => void;
      showShortcutsHelp?: (show: boolean) => void;
      undo?: () => void;
      redo?: () => void;
    }
  ): void {
    switch (action) {
      case 'new-node':
        callbacks.showAddMenu?.();
        break;

      case 'duplicate':
        const nodesToDuplicate = this.getSelectedNodes(nodes);
        if (nodesToDuplicate.length > 0) {
          nodesToDuplicate.forEach(node => {
            this.duplicateNode(node, nodes);
          });
          this.toastService.showToast(`Duplicated ${nodesToDuplicate.length} node(s)`, 'success');
        } else {
          this.toastService.showToast('No nodes selected', 'info');
        }
        break;

      case 'copy':
        this.copySelectedNodes(nodes);
        break;

      case 'paste':
        this.pasteNodes(nodes, zoomConfig, gridContainer);
        break;

      case 'cut':
        this.cutSelectedNodes(nodes);
        break;

      case 'save':
        // Trigger save from sidebar
        const sidebar = document.querySelector('app-sidebar');
        if (sidebar) {
          const saveButton = sidebar.querySelector('button[type="button"]') as HTMLButtonElement;
          if (saveButton && !saveButton.disabled) {
            saveButton.click();
          }
        }
        break;

      case 'find':
        this.searchService.open();
        break;

      case 'select-all':
        const allNodeIds = nodes.map(n => n.id);
        this.selectionService.selectAll(allNodeIds);
        break;

      case 'undo':
        callbacks.undo?.();
        break;

      case 'redo':
        callbacks.redo?.();
        break;

      case 'delete':
        this.deleteSelectedNodes(nodes, callbacks.closeAddMenu);
        break;

      case 'escape':
        this.selectionService.clearSelection();
        callbacks.closeAddMenu?.();
        callbacks.clearConnectionSelection?.();
        this.searchService.close();
        callbacks.showShortcutsHelp?.(false);
        break;

      case 'help':
        callbacks.showShortcutsHelp?.(true);
        break;

      case 'move-up':
        this.moveSelectedNodes(nodes, 0, -10);
        break;

      case 'move-down':
        this.moveSelectedNodes(nodes, 0, 10);
        break;

      case 'move-left':
        this.moveSelectedNodes(nodes, -10, 0);
        break;

      case 'move-right':
        this.moveSelectedNodes(nodes, 10, 0);
        break;
    }
  }

  /**
   * Copy selected nodes
   */
  copySelectedNodes(nodes: Node[]): void {
    const nodesToCopy = this.getSelectedNodes(nodes);
    if (nodesToCopy.length === 0) {
      this.toastService.showToast('No nodes selected', 'info');
      return;
    }

    this.clipboardService.copyNodes(nodesToCopy);
    this.toastService.showToast(`Copied ${nodesToCopy.length} node(s)`, 'success');
  }

  /**
   * Cut selected nodes
   */
  cutSelectedNodes(nodes: Node[]): void {
    const nodesToCut = this.getSelectedNodes(nodes);
    if (nodesToCut.length === 0) {
      this.toastService.showToast('No nodes selected', 'info');
      return;
    }

    this.clipboardService.cutNodes(nodesToCut);
    this.toastService.showToast(`Cut ${nodesToCut.length} node(s)`, 'success');
  }

  /**
   * Delete selected nodes
   */
  deleteSelectedNodes(nodes: Node[], onCloseMenu?: () => void): void {
    const nodesToDelete = this.getSelectedNodes(nodes);
    if (nodesToDelete.length === 0) {
      this.toastService.showToast('No nodes selected', 'info');
      return;
    }

    // Delete connections first
    const allConnections = this.connectionService.getAllConnections(nodes);
    nodesToDelete.forEach(node => {
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
    });

    nodesToDelete.forEach(node => {
      this.nodeService.deleteNode(node.id);
    });

    this.selectionService.clearSelection();
    onCloseMenu?.();
    this.toastService.showToast(`Deleted ${nodesToDelete.length} node(s)`, 'success');
  }

  /**
   * Paste nodes
   */
  pasteNodes(nodes: Node[], zoomConfig: ZoomConfig, gridContainer: ElementRef<HTMLElement>): void {
    if (!this.clipboardService.hasClipboardData()) {
      this.toastService.showToast('Clipboard is empty', 'info');
      return;
    }

    const container = gridContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const viewportCenterX = (scrollLeft + containerRect.width / 2) / zoomConfig.level;
    const viewportCenterY = (scrollTop + containerRect.height / 2) / zoomConfig.level;

    const pasteResult = this.clipboardService.pasteNodes({
      x: viewportCenterX - 200,
      y: viewportCenterY - 100
    });

    if (pasteResult) {
      const currentNodes = [...this.nodeService.nodes];
      const allNodes = [...currentNodes, ...pasteResult.nodes];
      this.nodeService.loadNodes(allNodes);

      if (this.clipboardService.isCutMode()) {
        const nodesToDelete = this.getSelectedNodes(nodes);
        nodesToDelete.forEach(node => {
          this.nodeService.deleteNode(node.id);
        });
        this.selectionService.clearSelection();
      }

      this.toastService.showToast(`Pasted ${pasteResult.nodes.length} node(s)`, 'success');
    }
  }

  /**
   * Duplicate a node
   */
  duplicateNode(node: Node, nodes: Node[]): void {
    this.clipboardService.copyNodes([node]);
    const pasteResult = this.clipboardService.pasteNodes({ x: 50, y: 50 });

    if (pasteResult && pasteResult.nodes.length > 0) {
      const currentNodes = [...this.nodeService.nodes];
      const allNodes = [...currentNodes, ...pasteResult.nodes];
      this.nodeService.loadNodes(allNodes);
      this.toastService.showToast('Node duplicated', 'success');
    }
  }

  /**
   * Move selected nodes
   */
  moveSelectedNodes(nodes: Node[], deltaX: number, deltaY: number): void {
    const selectedNodes = this.getSelectedNodes(nodes);
    if (selectedNodes.length === 0) {
      return;
    }

    selectedNodes.forEach(node => {
      const newPosition = {
        x: node.position.x + deltaX,
        y: node.position.y + deltaY
      };
      const snappedPosition = this.gridSnapService.snapPosition(newPosition);
      this.nodeService.moveNode(node.id, snappedPosition);
    });
  }

  /**
   * Calculate new node position
   */
  calculateNewNodePosition(nodes: Node[], selectedNode: Node | null): { x: number; y: number } {
    if (nodes.length === 0) {
      return { x: 200, y: 200 };
    }

    if (selectedNode) {
      return {
        x: selectedNode.position.x + 350,
        y: selectedNode.position.y
      };
    }

    return {
      x: 200 + nodes.length * 50,
      y: 200 + nodes.length * 50
    };
  }

  /**
   * Get selected nodes
   */
  private getSelectedNodes(nodes: Node[]): Node[] {
    const selected: Node[] = [];
    const selectedNodeIds = this.selectionService.selectedNodeIds;

    if (selectedNodeIds.size > 0) {
      selectedNodeIds.forEach(nodeId => {
        const node = this.nodeService.findNodeById(nodeId);
        if (node && !selected.includes(node)) {
          selected.push(node);
        }
      });
    }

    return selected;
  }
}

