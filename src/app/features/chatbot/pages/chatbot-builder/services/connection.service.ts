import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../../../../../core/models/chatbot.model';
import { ToastService } from '../../../../../core/services/toast-message.service';
import { ValidationMessageService } from './validation-message.service';
import { NODE_CONSTANTS } from '../constants/node.constants';

export interface Connection {
  from: Node;
  to: Node;
  buttonIndex?: number;
  buttonId?: string;
  id?: string;
  label?: string;
  type: 'node' | 'button';
  style?: {
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  created_at?: Date;
  validated?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private connectionsSubject = new BehaviorSubject<Connection[]>([]);
  private connectionStatsSubject = new BehaviorSubject<any>(null);

  connections$ = this.connectionsSubject.asObservable();
  connectionStats$ = this.connectionStatsSubject.asObservable();

  private currentNodes: Node[] = [];

  constructor(
    private toastService: ToastService,
    private validationMessageService: ValidationMessageService
  ) {}

  createConnection(
    sourceNode: Node,
    targetNode: Node,
    buttonIndex?: number,
    buttonId?: string
  ): boolean {

    const validation = this.validateConnection(sourceNode, targetNode, buttonIndex);
    if (!validation.isValid) {
      const errorMessage = validation.error
        ? this.validationMessageService.formatConnectionError(validation.error)
        : 'Cannot create this connection';
      this.toastService.showToast(errorMessage, 'error');
      return false;
    }

    try {
      if (sourceNode.type === 'interactive_buttons' && buttonIndex !== undefined) {
        this.createButtonConnection(sourceNode, targetNode, buttonIndex, buttonId);
      } else {
        this.createNodeConnection(sourceNode, targetNode);
      }
      this.updateParentRelationships(sourceNode, targetNode);
      this.updateNextNodesReferences(sourceNode, targetNode);
      return true;
    } catch (error) {
      this.toastService.showToast('Unable to create connection. Please try again.', 'error');
      return false;
    }
  }

  deleteConnection(
    sourceNode: Node,
    targetNode: Node,
    buttonIndex?: number
  ): boolean {

    try {
      if (sourceNode.type === 'interactive_buttons' && buttonIndex !== undefined) {
        this.deleteButtonConnection(sourceNode, targetNode, buttonIndex);
      } else {
        this.deleteNodeConnection(sourceNode, targetNode);
      }

      this.removeParentRelationship(targetNode, sourceNode, buttonIndex);
      this.updateNextNodesAfterDeletion(sourceNode, targetNode);
      return true;

    } catch (error) {
      this.toastService.showToast('Unable to delete connection. Please try again.', 'error');
      return false;
    }
  }

  getAllConnections(nodes: Node[]): Connection[] {
    this.currentNodes = nodes;

    const connections: Connection[] = [];
    const visitedPairs = new Set<string>();

    for (const node of nodes) {

      if (node.type === 'interactive_buttons') {

        if (node.buttonConnections) {
          Object.entries(node.buttonConnections).forEach(([buttonIndexStr, targetNodeId]) => {
            const buttonIndex = parseInt(buttonIndexStr);
            const targetNode = this.findNodeById(targetNodeId);

            if (targetNode) {
              const buttonId = this.getButtonId(node, buttonIndex);
              const pairKey = `${node.id}-${targetNode.id}-btn-${buttonIndex}`;

              if (!visitedPairs.has(pairKey)) {
                connections.push({
                  from: node,
                  to: targetNode,
                  buttonIndex,
                  buttonId,
                  type: 'button',
                  id: `conn_${node.id}_${targetNode.id}_btn_${buttonIndex}`,
                  label: this.getButtonLabel(node, buttonIndex),
                  style: this.getButtonConnectionStyle(buttonIndex),
                  created_at: new Date()
                });
                visitedPairs.add(pairKey);
              }
            }
          });
        }
      } else {
        for (const child of node.children) {
          const pairKey = `${node.id}-${child.id}`;
          if (!visitedPairs.has(pairKey)) {
            connections.push({
              from: node,
              to: child,
              type: 'node',
              id: `conn_${node.id}_${child.id}`,
              created_at: new Date()
            });
            visitedPairs.add(pairKey);
          }
        }
      }
    }
    this.connectionsSubject.next(connections);
    const stats = this.calculateConnectionStatsNonRecursive(connections, nodes);
    this.connectionStatsSubject.next(stats);
    return connections;
  }

getConnectionPoint(node: Node, buttonIndex?: number): { x: number; y: number } | null {
  const nodeWidth = node.type === 'interactive_buttons' ? 384 : 320;
  const nodeHeight = 120;

  let yPosition: number;

  if (node.type === 'interactive_buttons' && buttonIndex !== undefined) {
    const buttonPosition = this.getCalculatedButtonPosition(node, buttonIndex);
    yPosition = buttonPosition ? buttonPosition.y : node.position.y + nodeHeight / 2;
  } else {
    yPosition = node.position.y + nodeHeight / 2;
  }

  // Return coordinates without padding - padding will be added by the component using this
  return {
    x: node.position.x + nodeWidth,
    y: yPosition
  };
}

  private createButtonConnection(
    sourceNode: Node,
    targetNode: Node,
    buttonIndex: number,
    buttonId?: string
  ): void {
    if (!sourceNode.buttonConnections) {
      sourceNode.buttonConnections = {};
    }
    sourceNode.buttonConnections[buttonIndex] = targetNode.id;
    if (sourceNode.body.body_button?.action?.buttons?.[buttonIndex]?.reply) {
    sourceNode.body.body_button.action.buttons[buttonIndex].reply.next_node_id = targetNode.id;
  }
  }

  private createNodeConnection(sourceNode: Node, targetNode: Node): void {
    if (sourceNode.type === 'message' || sourceNode.type === 'question') {
      if (sourceNode.children.length > 0) {
        sourceNode.children.forEach(existingChild => {
          this.removeParentRelationship(existingChild, sourceNode);
        });
        sourceNode.children = [];
      }
    }

    if (!sourceNode.children.some(child => child.id === targetNode.id)) {
      sourceNode.children.push(targetNode);
    }
  }

  private deleteButtonConnection(
    sourceNode: Node,
    targetNode: Node,
    buttonIndex: number
  ): void {
    if (sourceNode.buttonConnections) {
      delete sourceNode.buttonConnections[buttonIndex];
    }
  }

  private deleteNodeConnection(sourceNode: Node, targetNode: Node): void {
    const childIndex = sourceNode.children.findIndex(child => child.id === targetNode.id);
    if (childIndex > -1) {
      sourceNode.children.splice(childIndex, 1);
    }
  }

  private updateParentRelationships(sourceNode: Node, targetNode: Node): void {
    if (!targetNode.parents) {
      targetNode.parents = [];
    }

    if (!targetNode.parents.some(parent => parent.id === sourceNode.id)) {
      targetNode.parents.push(sourceNode);
    }
  }

  private removeParentRelationship(
    targetNode: Node,
    sourceNode: Node,
    buttonIndex?: number
  ): void {
    if (targetNode.parents) {
      if (sourceNode.type === 'interactive_buttons' && buttonIndex !== undefined && sourceNode.buttonConnections) {
        const hasOtherButtonConnections = Object.entries(sourceNode.buttonConnections)
          .some(([idx, targetId]) =>
            parseInt(idx) !== buttonIndex && targetId === targetNode.id
          );

        if (hasOtherButtonConnections) {
          return;
        }
      }

      const parentIndex = targetNode.parents.findIndex(parent => parent.id === sourceNode.id);
      if (parentIndex > -1) {
        targetNode.parents.splice(parentIndex, 1);
      }
    }
  }

  private updateNextNodesReferences(sourceNode: Node, targetNode: Node): void {
    if (sourceNode.type === 'message' || sourceNode.type === 'question') {
      sourceNode.next_nodes = targetNode.id;
    } else if (sourceNode.type === 'interactive_buttons' && !sourceNode.next_nodes) {
      sourceNode.next_nodes = targetNode.id;
    }
  }

  private updateNextNodesAfterDeletion(sourceNode: Node, targetNode: Node): void {
    if (sourceNode.next_nodes === targetNode.id) {
      if (sourceNode.type === 'interactive_buttons' && sourceNode.buttonConnections) {
        const remainingConnections = Object.values(sourceNode.buttonConnections);
        sourceNode.next_nodes = remainingConnections.length > 0 ? remainingConnections[0] : null;
      } else {
        sourceNode.next_nodes = sourceNode.children.length > 0 ? sourceNode.children[0].id : null;
      }
    }
  }

  private validateConnection(
    sourceNode: Node,
    targetNode: Node,
    buttonIndex?: number
  ): { isValid: boolean; error?: string } {

    if (sourceNode.id === targetNode.id) {
      return { isValid: false, error: 'Cannot connect node to itself' };
    }

    if (sourceNode.type === 'interactive_buttons' && buttonIndex !== undefined) {
      if (sourceNode.buttonConnections && sourceNode.buttonConnections[buttonIndex] === targetNode.id) {
        return { isValid: false, error: 'Button is already connected to this node' };
      }

      const buttonCount = sourceNode.body.body_button?.action?.buttons?.length || 0;
      if (buttonIndex >= buttonCount) {
        return { isValid: false, error: 'Button index out of range' };
      }

      return { isValid: true };
    }

    if (sourceNode.type === 'message' || sourceNode.type === 'question') {
      if (sourceNode.children.some(child => child.id === targetNode.id)) {
        return { isValid: false, error: 'Connection already exists' };
      }
      return { isValid: true };
    }

    if (sourceNode.children.some(child => child.id === targetNode.id)) {
      return { isValid: false, error: 'Connection already exists' };
    }

    return { isValid: true };
  }

private getCalculatedButtonPosition(node: Node, buttonIndex: number): { x: number; y: number } | null {
  if (!node) return null;

  const nodeWidth = 384;
  const nodeX = node.position.x;
  const nodeY = node.position.y;

  const measurements = {
    nodeHeader: 80,
    debugInfo: 32,
    interactiveType: 72,
    headerSection: 100,
    bodySection: 120,
    footerSection: 72,
    buttonsSectionHeader: 48,
  };

  const buttonsSectionStartY = Object.values(measurements).reduce((sum, height) => sum + height, 0);
  const buttonContainerHeight = 104;
  const buttonSpacing = 16;

  const buttonCenterY = buttonsSectionStartY + (buttonIndex * (buttonContainerHeight + buttonSpacing)) + (buttonContainerHeight / 2);

  // Return coordinates without padding - padding will be added by the component using this
  return {
    x: nodeX + nodeWidth,
    y: nodeY + buttonCenterY,
  };
}

  private calculateConnectionStatsNonRecursive(connections: Connection[], nodes: Node[]) {
    const nodeConnections = connections.filter(conn => conn.type === 'node').length;
    const buttonConnections = connections.filter(conn => conn.type === 'button').length;

    return {
      totalConnections: connections.length,
      nodeConnections,
      buttonConnections,
      circularConnections: 0,
      orphanedNodes: 0
    };
  }

  private getButtonConnectionStyle(buttonIndex: number) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    return {
      color: colors[buttonIndex] || '#6b7280',
      strokeWidth: 2,
      strokeDasharray: '8,4'
    };
  }

  private getButtonLabel(node: Node, buttonIndex: number): string {
    const button = node.body.body_button?.action?.buttons?.[buttonIndex];
    return button?.reply?.title || `Button ${buttonIndex + 1}`;
  }

  private getButtonId(node: Node, buttonIndex: number): string {
    const button = node.body.body_button?.action?.buttons?.[buttonIndex];
    return button?.reply?.id || `button_${buttonIndex}`;
  }

  private findNodeById(id: string): Node | null {
    return this.currentNodes.find(node => node.id === id) || null;
  }
}
