// node-management.service.ts - Enhanced with single first node enforcement
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { uuidv7 } from 'uuidv7';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

import {
  FlowNodeType,
  DynamicFlowNodeBody,
  Node,
  ContentItem
} from '../../../../../core/models/chatbot.model';
import { updateChatbotFlowNodes } from '../../../../../core/services/chatbot/ngrx/chatbot.actions';
import { Store } from '@ngrx/store';
import {
  ChatbotSerializationService,
  SerializedNode,
  ValidationResult
} from '../../../../../core/services/chatbot/utility';
import { ToastService } from '../../../../../core/services/toast-message.service';
import { ValidationMessageService } from './validation-message.service';

export interface FlowStatistics {
  totalNodes: number;
  nodesByType: Record<FlowNodeType, number>;
  totalConnections: number;
  orphanedNodes: number;
  startingNodes: number;
  finalNodes: number;
  averageConnectionsPerNode: number;
  hasMediaContent: boolean;
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}

export interface NodeOperation {
  type: 'add' | 'update' | 'delete' | 'move' | 'connect' | 'disconnect' | 'load' | 'set_first';
  nodeId: string;
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root',
})
export class NodeManagementService {
  private nodesSubject = new BehaviorSubject<Node[]>([]);
  private operationHistorySubject = new BehaviorSubject<NodeOperation[]>([]);
  private isModifiedSubject = new BehaviorSubject<boolean>(false);
  private validationResultSubject = new BehaviorSubject<ValidationResult | null>(null);

  private firstNodeChangedSubject = new BehaviorSubject<string | null>(null);

  nodes$ = this.nodesSubject.asObservable();
  operationHistory$ = this.operationHistorySubject.asObservable();
  isModified$ = this.isModifiedSubject.asObservable();
  validationResult$ = this.validationResultSubject.asObservable();

  firstNodeChanged$ = this.firstNodeChangedSubject.asObservable();

  statistics$ = this.nodes$.pipe(
    map(nodes => this.calculateFlowStatistics(nodes)),
    distinctUntilChanged()
  );

  validationStatus$ = combineLatest([
    this.nodes$,
    this.validationResult$
  ]).pipe(
    debounceTime(500),
    map(([nodes, lastResult]) => {
      if (nodes.length === 0) return null;
      return ChatbotSerializationService.validateNodes(nodes);
    }),
    distinctUntilChanged()
  );

  constructor(
    private store: Store,
    private toastService: ToastService,
    private validationMessageService: ValidationMessageService
  ) {
    this.nodes$.pipe(
      debounceTime(1000)
    ).subscribe(nodes => {
      if (nodes.length > 0) {
        const result = ChatbotSerializationService.validateNodes(nodes);
        this.validationResultSubject.next(result);
      }
    });
  }

  get nodes(): Node[] {
    return this.nodesSubject.value;
  }

  get isModified(): boolean {
    return this.isModifiedSubject.value;
  }

  get currentValidation(): ValidationResult | null {
    return this.validationResultSubject.value;
  }

  setAsFirstNode(nodeId: string, isFirst: boolean): boolean {
    const nodes = [...this.nodes];
    let updated = false;
    let newFirstNodeId: string | null = null;

    if (isFirst) {
      nodes.forEach(node => {
        if (node.id !== nodeId && node.is_first) {
          node.is_first = false;
          updated = true;
        }
      });

      const targetNode = nodes.find(node => node.id === nodeId);
      if (targetNode && !targetNode.is_first) {
        targetNode.is_first = true;
        updated = true;
        newFirstNodeId = nodeId;
      }
    } else {
      const targetNode = nodes.find(node => node.id === nodeId);
      if (targetNode && targetNode.is_first) {
        targetNode.is_first = false;
        updated = true;
        newFirstNodeId = null;

        const hasOtherFirstNode = nodes.some(node => node.id !== nodeId && node.is_first);
        if (!hasOtherFirstNode && nodes.length > 1) {
          const firstAvailableNode = nodes.find(node => node.id !== nodeId);
          if (firstAvailableNode) {
            firstAvailableNode.is_first = true;
            newFirstNodeId = firstAvailableNode.id;
            this.toastService.showToast(
              `"${firstAvailableNode.title}" is now the first node`,
              'info'
            );
          }
        }
      }
    }

    if (updated) {
      const firstNodes = nodes.filter(node => node.is_first);

      if (firstNodes.length === 0 && nodes.length > 0) {
        nodes[0].is_first = true;
        newFirstNodeId = nodes[0].id;
      } else if (firstNodes.length > 1) {
        nodes.forEach(node => {
          if (node.id !== nodeId && node.is_first) {
            node.is_first = false;
          }
        });
        newFirstNodeId = nodeId;
      }

      this.updateNodes(nodes);

      this.firstNodeChangedSubject.next(newFirstNodeId);

      this.logOperation({
        type: 'set_first',
        nodeId,
        timestamp: new Date(),
        details: {
          isFirst,
          newFirstNodeId,
          totalFirstNodes: nodes.filter(n => n.is_first).length
        }
      });

      const targetNode = nodes.find(node => node.id === nodeId);
      const message = isFirst
        ? `"${targetNode?.title}" set as first node`
        : newFirstNodeId
          ? `First node changed to "${nodes.find(n => n.id === newFirstNodeId)?.title}"`
          : `"${targetNode?.title}" is no longer the first node`;

      this.toastService.showToast(message, 'success');

      return true;
    }

    return false;
  }

  getFirstNode(): Node | null {
    const firstNodes = this.nodes.filter(node => node.is_first);

    if (firstNodes.length === 0) {
      return null;
    }

    if (firstNodes.length > 1) {
      this.fixMultipleFirstNodes();
      return firstNodes[0];
    }

    return firstNodes[0];
  }

  private fixMultipleFirstNodes(): void {
    const nodes = [...this.nodes];
    let firstNodeFound = false;

    nodes.forEach(node => {
      if (node.is_first) {
        if (!firstNodeFound) {
          firstNodeFound = true;
        } else {
          node.is_first = false;
        }
      }
    });

    this.updateNodes(nodes);
    this.toastService.showToast('Fixed multiple first nodes issue', 'error');
  }

  isFirstNode(nodeId: string): boolean {
    const node = this.findNodeById(nodeId);
    const isFirst = node?.is_first || false;

    if (isFirst) {
      const allFirstNodes = this.nodes.filter(n => n.is_first);
      if (allFirstNodes.length > 1) {
      }
    }

    return isFirst;
  }

  getFirstNodeValidation(): {
    isValid: boolean;
    firstNodeCount: number;
    firstNodeId: string | null;
    errors: string[];
  } {
    const firstNodes = this.nodes.filter(node => node.is_first);
    const errors: string[] = [];

    if (firstNodes.length === 0) {
      errors.push('Please set a starting node for your chatbot');
    } else if (firstNodes.length > 1) {
      errors.push('Only one node can be the starting node');
    }

    return {
      isValid: firstNodes.length === 1,
      firstNodeCount: firstNodes.length,
      firstNodeId: firstNodes.length === 1 ? firstNodes[0].id : null,
      errors
    };
  }

  updateNodes(nodes: Node[]): void {
    this.nodesSubject.next(nodes);
    this.markAsModified();
  }

  loadNodes(nodes: Node[]): void {

    const firstNodes = nodes.filter(node => node.is_first);
    if (firstNodes.length === 0 && nodes.length > 0) {
      nodes[0].is_first = true;
    } else if (firstNodes.length > 1) {
      nodes.forEach((node, index) => {
        if (node.is_first && index > 0) {
          node.is_first = false;
        }
      });
    }


    this.nodesSubject.next(nodes);

    this.isModifiedSubject.next(false);

    const currentFirstNode = nodes.find(node => node.is_first);
    this.firstNodeChangedSubject.next(currentFirstNode?.id || null);

    this.logOperation({
      type: 'load',
      nodeId: 'flow',
      timestamp: new Date(),
      details: { nodeCount: nodes.length, firstNodeId: currentFirstNode?.id }
    });

  }

  clearNodes(): void {
    this.nodesSubject.next([]);
    this.operationHistorySubject.next([]);
    this.isModifiedSubject.next(false);
    this.validationResultSubject.next(null);
    this.firstNodeChangedSubject.next(null);
  }

  submitFlowNodes(
    chatbotId: string,
    options?: {
      validateFirst?: boolean;
      showProgress?: boolean;
      dryRun?: boolean;
    }
  ): Promise<boolean> {

    const opts = {
      validateFirst: true,
      showProgress: true,
      dryRun: false,
      ...options
    };

    return new Promise((resolve, reject) => {
      try {
        const currentNodes = this.nodes;

        if (currentNodes.length === 0) {
          this.toastService.showToast('Please add at least one node to save', 'error');
          resolve(false);
          return;
        }

        const firstNodeValidation = this.getFirstNodeValidation();
        if (!firstNodeValidation.isValid) {
          const errorMessage = firstNodeValidation.errors[0] || 'Please set a starting node';
          this.toastService.showToast(errorMessage, 'error');
          reject(new Error('First node validation failed'));
          return;
        }

        if (opts.validateFirst) {
          const validation = this.validateFlow();
          if (!validation.isValid) {
            const formattedErrors = this.validationMessageService.formatValidationErrors(validation.errors);
            const primaryError = this.validationMessageService.getPrimaryErrorMessage(validation.errors);
            const errorMessage = primaryError || formattedErrors[0] || 'Please fix the errors before saving';

            // Show primary error, and if there are multiple, show count
            if (formattedErrors.length > 1) {
              this.toastService.showToast(`${errorMessage} (${formattedErrors.length} more issues)`, 'error');
            } else {
              this.toastService.showToast(errorMessage, 'error');
            }
            reject(new Error('Validation failed'));
            return;
          }
        }

        if (opts.showProgress) {
          this.toastService.showToast('Preparing flow for submission...', 'info');
        }

        const serializedNodes = this.prepareNodesForSubmission();

        if (opts.dryRun) {
          resolve(true);
          return;
        }

        this.store.dispatch(
          updateChatbotFlowNodes({
            flowNodes: {
              chatbot_id: chatbotId,
              nodes: serializedNodes
            },
          })
        );

        this.markAsSaved();

        this.logOperation({
          type: 'update',
          nodeId: 'flow',
          timestamp: new Date(),
          details: {
            nodeCount: serializedNodes.length,
            chatbotId,
            firstNodeId: firstNodeValidation.firstNodeId
          }
        });

        if (opts.showProgress) {
          this.toastService.showToast('Flow saved successfully', 'success');
        }

        resolve(true);

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save flow';
        this.toastService.showToast(message, 'error');
        reject(error);
      }
    });
  }

  addNode(
    type: FlowNodeType,
    position: { x: number; y: number },
    options?: {
      setAsFirst?: boolean;
      templateData?: any;
    }
  ): Node {

    const shouldBeFirst = options?.setAsFirst || this.nodes.length === 0;

    const newNode: Node = {
      id: uuidv7(),
      type,
      title: this.getDefaultTitle(type),
      body: this.createEmptyBody(type, options?.templateData),
      position,
      children: [],
      parents: [],
      parent: null,
      is_first: shouldBeFirst,
      is_final: false,
    };

    let updatedNodes = [...this.nodes];

    if (newNode.is_first) {
      updatedNodes = updatedNodes.map(node => ({
        ...node,
        is_first: false
      }));
    }

    updatedNodes.push(newNode);
    this.updateNodes(updatedNodes);
    // ✅ FORCE UI UPDATE FOR NEW NODE - Ensure it's visible immediately
    setTimeout(() => {
      const nodeElement = document.querySelector(`[data-node-id="${newNode.id}"]`) as HTMLElement;
      if (nodeElement) {
        // Force high z-index for the new node
        nodeElement.style.zIndex = shouldBeFirst ? '25' : '20';

        // Add a slight animation to make it visible
        nodeElement.style.opacity = '0';
        nodeElement.style.transform = 'scale(0.8)';

        requestAnimationFrame(() => {
          nodeElement.style.transition = 'all 0.3s ease';
          nodeElement.style.opacity = '1';
          nodeElement.style.transform = 'scale(1)';
        });
      }
    }, 10);

    if (newNode.is_first) {
      this.firstNodeChangedSubject.next(newNode.id);
    }

    this.logOperation({
      type: 'add',
      nodeId: newNode.id,
      timestamp: new Date(),
      details: { type, position, isFirst: newNode.is_first }
    });

    return newNode;
  }

  deleteNode(nodeId: string): boolean {
    const nodeToDelete = this.findNodeById(nodeId);
    if (!nodeToDelete) {
      return false;
    }

    const wasFirstNode = nodeToDelete.is_first;
    const updatedNodes = this.removeNodeFromArray(this.nodes, nodeId);

    let newFirstNodeId: string | null = null;
    if (wasFirstNode && updatedNodes.length > 0) {
      updatedNodes[0].is_first = true;
      newFirstNodeId = updatedNodes[0].id;
      this.toastService.showToast(
        `"${updatedNodes[0].title}" is now the first node`,
        'info'
      );
    }

    this.updateNodes(updatedNodes);

    if (wasFirstNode) {
      this.firstNodeChangedSubject.next(newFirstNodeId);
    }

    this.logOperation({
      type: 'delete',
      nodeId,
      timestamp: new Date(),
      details: {
        type: nodeToDelete.type,
        hadConnections: nodeToDelete.children.length > 0,
        wasFirst: wasFirstNode,
        newFirstNodeId
      }
    });

    this.toastService.showToast(`Node deleted`, 'info');
    return true;
  }

  updateNode(nodeId: string, updates: Partial<Node>): boolean {
    const updatedNodes = this.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    );

    if (JSON.stringify(updatedNodes) !== JSON.stringify(this.nodes)) {
      this.updateNodes(updatedNodes);

      this.logOperation({
        type: 'update',
        nodeId,
        timestamp: new Date(),
        details: { updatedFields: Object.keys(updates) }
      });

      return true;
    }

    return false;
  }

  moveNode(nodeId: string, newPosition: { x: number; y: number }): boolean {
    const node = this.findNodeById(nodeId);
    if (!node) return false;

    const oldPosition = { ...node.position };
    const success = this.updateNode(nodeId, { position: newPosition });

    if (success) {
      this.logOperation({
        type: 'move',
        nodeId,
        timestamp: new Date(),
        details: { from: oldPosition, to: newPosition }
      });
    }

    return success;
  }

  validateFlow(): ValidationResult {
    return ChatbotSerializationService.validateNodes(this.nodes);
  }

  getFlowStatistics(): FlowStatistics {
    return this.calculateFlowStatistics(this.nodes);
  }

  exportFlow(): {
    metadata: any;
    nodes: SerializedNode[];
    statistics: FlowStatistics;
    validation: ValidationResult;
  } {
    return {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'chatbot-builder'
      },
      nodes: this.prepareNodesForSubmission(),
      statistics: this.getFlowStatistics(),
      validation: this.validateFlow()
    };
  }

  importFlow(flowData: any): boolean {
    try {
      if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
        throw new Error('Invalid flow data structure');
      }

      const importedNodes: Node[] = flowData.nodes.map((serializedNode: SerializedNode) => ({
        ...serializedNode,
        children: [],
        parents: [],
        parent: null,
        buttonConnections: {}
      }));

      this.loadNodes(importedNodes);
      this.toastService.showToast(`Imported ${importedNodes.length} nodes`, 'success');
      return true;
    } catch (error) {
      this.toastService.showToast(`Import failed: ${error}`, 'error');
      return false;
    }
  }

  clearFlow(): void {
    this.clearNodes();
    this.toastService.showToast('Flow cleared', 'info');
  }

  findNodeById(id: string): Node | null {
    return this.nodes.find(node => node.id === id) || null;
  }

  getAllNodesFlat(): Node[] {
    return [...this.nodes];
  }

  hasUnsavedChanges(): boolean {
    return this.isModified;
  }

  getNodeCountByType(type: FlowNodeType): number {
    return this.nodes.filter(node => node.type === type).length;
  }

  getStartingNodes(): Node[] {
    return this.nodes.filter(node => node.is_first);
  }

  getFinalNodes(): Node[] {
    return this.nodes.filter(node =>
      node.children.length === 0 &&
      (!node.buttonConnections || Object.keys(node.buttonConnections).length === 0)
    );
  }

  getOrphanedNodes(): Node[] {
    const referencedNodeIds = new Set<string>();

    this.nodes.forEach(node => {
      node.children.forEach(child => referencedNodeIds.add(child.id));
      if (node.buttonConnections) {
        Object.values(node.buttonConnections).forEach(targetId => {
          if (targetId) referencedNodeIds.add(targetId);
        });
      }
    });

    return this.nodes.filter(node =>
      !node.is_first && !referencedNodeIds.has(node.id)
    );
  }

  private markAsModified(): void {
    this.isModifiedSubject.next(true);
  }

  private markAsSaved(): void {
    this.isModifiedSubject.next(false);
  }

  private logOperation(operation: NodeOperation): void {
    const currentHistory = this.operationHistorySubject.value;
    const newHistory = [...currentHistory, operation];

    if (newHistory.length > 100) {
      newHistory.splice(0, newHistory.length - 100);
    }

    this.operationHistorySubject.next(newHistory);
  }

  private prepareNodesForSubmission(): SerializedNode[] {
    return ChatbotSerializationService.prepareNodesForSubmission(this.nodes);
  }

  private hasMediaContent(nodes: Node[]): boolean {
    return nodes.some(node => {
      if (node.body.body_message?.content_items) {
        return node.body.body_message.content_items.some(item =>
          item.type !== 'text' && (item.content.bytes || item.content.preview_url)
        );
      }
      if (node.body.body_button?.header?.media?.bytes) {
        return true;
      }
      return false;
    });
  }

  private calculateFlowStatistics(nodes: Node[]): FlowStatistics {
    const nodesByType: Record<FlowNodeType, number> = {
      message: 0,
      question: 0,
      interactive_buttons: 0
    };

    let totalConnections = 0;
    let orphanedNodes = 0;
    const referencedNodeIds = new Set<string>();

    nodes.forEach(node => {
      nodesByType[node.type]++;
      totalConnections += node.children.length;
      node.children.forEach(child => referencedNodeIds.add(child.id));
      if (node.buttonConnections) {
        Object.values(node.buttonConnections).forEach(targetId => {
          if (targetId) referencedNodeIds.add(targetId);
        });
      }
    });

    orphanedNodes = nodes.filter(node =>
      !node.is_first && !referencedNodeIds.has(node.id)
    ).length;

    const startingNodes = nodes.filter(node => node.is_first).length;
    const finalNodes = nodes.filter(node =>
      node.children.length === 0 &&
      (!node.buttonConnections || Object.keys(node.buttonConnections).length === 0)
    ).length;

    const averageConnectionsPerNode = nodes.length > 0 ? totalConnections / nodes.length : 0;
    const hasMediaContent = this.hasMediaContent(nodes);

    let estimatedComplexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (nodes.length > 20 || hasMediaContent || averageConnectionsPerNode > 2) {
      estimatedComplexity = 'complex';
    } else if (nodes.length > 5 || averageConnectionsPerNode > 1.5) {
      estimatedComplexity = 'medium';
    }

    return {
      totalNodes: nodes.length,
      nodesByType,
      totalConnections,
      orphanedNodes,
      startingNodes,
      finalNodes,
      averageConnectionsPerNode: Math.round(averageConnectionsPerNode * 100) / 100,
      hasMediaContent,
      estimatedComplexity
    };
  }

  private removeNodeFromArray(nodes: Node[], nodeId: string): Node[] {
    return nodes
      .filter(node => node.id !== nodeId)
      .map(node => ({
        ...node,
        children: node.children.filter(child => child.id !== nodeId),
        parents: node.parents?.filter(parent => parent.id !== nodeId) || [],
        parent: node.parent?.id === nodeId ? null : node.parent,
        buttonConnections: node.buttonConnections ?
          Object.fromEntries(
            Object.entries(node.buttonConnections)
              .filter(([_, targetId]) => targetId !== nodeId)
          ) : undefined,
        next_nodes: node.next_nodes === nodeId ? null : node.next_nodes
      }));
  }

  private getDefaultTitle(type: FlowNodeType): string {
    const titles = {
      message: 'Send Message',
      question: 'Question',
      interactive_buttons: 'Interactive Buttons',
    };
    return titles[type];
  }

  private createEmptyBody(type: FlowNodeType, templateData?: any): DynamicFlowNodeBody {
    const bodyCreators = {
      message: () => ({
        body_message: {
          content_items: templateData?.content_items || []
        }
      }),
      question: () => ({
        body_question: {
          question_text: templateData?.question_text || '',
          answer_variant: templateData?.answer_variant || '',
          accept_media_response: templateData?.accept_media_response || false,
          save_to_variable: templateData?.save_to_variable || false,
          variable_name: templateData?.variable_name || '',
        },
      }),
      interactive_buttons: () => ({
        body_button: {
          type: 'button' as const,
          body: { text: templateData?.body_text || '' },
          action: { buttons: templateData?.buttons || [] },
        },
      }),
    };

    return bodyCreators[type]?.() || {};
  }
}
