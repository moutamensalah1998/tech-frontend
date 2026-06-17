// services/chatbot/serialization.utility.ts - Fixed Version
import { DynamicFlowNodeBody, FlowNodeType, Node, ContentItem, Position } from '../../../core/models/chatbot.model';

/**
 * Interface for serialized nodes that will be sent to the server
 */
export interface SerializedNode {
  id: string;
  type: FlowNodeType;
  title: string;
  body: DynamicFlowNodeBody;
  position: Position;
  is_first: boolean;
  is_final: boolean;
  next_nodes?: string | null;
  service_hook?: {
    service_type?: string;
    service_action?: string;
    user_id?: string;
    team_id?: string;
    on_success?: string;
    on_failure?: string;
  } | null;
}

/**
 * Interface for the complete flow payload
 */
export interface ChatbotFlowPayload {
  chatbot_id: string;
  nodes: SerializedNode[];
  metadata?: {
    version: string;
    created_at: string;
    total_nodes: number;
    validation_status: 'valid' | 'invalid';
    validation_errors?: string[];
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  nodeId: string;
  field: string;
  message: string;
}

/**
 * Enhanced serialization service for chatbot flow nodes
 */
export class ChatbotSerializationService {

  /**
   * Prepare nodes for server submission with comprehensive validation and cleaning
   */
  static prepareNodesForSubmission(nodes: Node[]): SerializedNode[] {
    const allNodes = this.getAllNodesFlat(nodes);
    const validationResult = this.validateNodes(allNodes);

    if (!validationResult.isValid) {
      console.warn('Nodes validation failed:', validationResult.errors);
      // You might want to throw an error or handle this differently based on requirements
    }

    return allNodes.map(node => this.serializeNode(node));
  }

  /**
   * Create complete payload for server submission
   */
  static createFlowPayload(chatbotId: string, nodes: Node[]): ChatbotFlowPayload {
    const serializedNodes = this.prepareNodesForSubmission(nodes);
    const validationResult = this.validateNodes(nodes);

    return {
      chatbot_id: chatbotId,
      nodes: serializedNodes,
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        total_nodes: serializedNodes.length,
        validation_status: validationResult.isValid ? 'valid' : 'invalid',
        validation_errors: validationResult.errors.map(e => `${e.nodeId}: ${e.message}`)
      }
    };
  }

  /**
   * Clean node body and ensure all media is properly base64 encoded
   * FIXED: Now properly handles button connections for interactive_buttons
   */
  private static cleanNodeBody(body: DynamicFlowNodeBody, node?: Node): DynamicFlowNodeBody {
    const cleanedBody = JSON.parse(JSON.stringify(body)); // Deep clone

    // Clean message node body
    if (cleanedBody.body_message?.content_items) {
      cleanedBody.body_message.content_items = cleanedBody.body_message.content_items.map(
        (item: ContentItem) => this.cleanContentItem(item)
      );
    }

    // Clean interactive buttons node body - FIXED SECTION
    if (cleanedBody.body_button && node) {
      cleanedBody.body_button = this.cleanInteractiveButtonsBody(cleanedBody.body_button, node);
    }

    return cleanedBody;
  }

  /**
   * FIXED: Clean interactive buttons body with proper next_node_id mapping
   */
  private static cleanInteractiveButtonsBody(buttonBody: any, node: Node): any {
    const cleaned = { ...buttonBody };

    // Clean header media if present
    if (cleaned.header?.media) {
      cleaned.header.media = this.cleanMediaObject(cleaned.header.media);
    }

    // FIXED: Ensure buttons array has proper next_node_id from buttonConnections
    if (cleaned.action?.buttons) {
      cleaned.action.buttons = cleaned.action.buttons
        .filter((button: any) => button.reply?.id && button.reply?.title)
        .map((button: any, index: number) => {
          // Get the connected node ID for this button from buttonConnections
          const connectedNodeId = node.buttonConnections?.[index];

          return {
            type: button.type || 'reply',
            reply: {
              id: button.reply.id,
              title: button.reply.title,
              next_node_id: connectedNodeId || null // FIXED: Map from buttonConnections
            }
          };
        });

    }

    return cleaned;
  }

  /**
   * Clean content item and ensure media is properly formatted
   */
  private static cleanContentItem(item: ContentItem): ContentItem {
    const cleaned: ContentItem = {
      type: item.type,
      order: item.order,
      content: { ...item.content }
    };

    // For media content items, ensure only necessary fields are included
    if (item.type !== 'text') {
      // Remove UI-only fields that shouldn't go to server
      delete (cleaned.content as any).preview_url;
      delete (cleaned.content as any).thumbnail_url;

      // Ensure required fields are present for media
      if (!cleaned.content.bytes || !cleaned.content.mime_type || !cleaned.content.file_name) {
        throw new Error(`Incomplete media content in item of type ${item.type}`);
      }
    }

    // For text content, ensure text_body exists
    if (item.type === 'text' && !cleaned.content.text_body) {
      throw new Error('Text content item missing text_body');
    }

    return cleaned;
  }

  /**
   * Clean media object for server submission
   */
  private static cleanMediaObject(media: any): any {
    return {
      filename: media.filename || media.file_name || '',
      mime_type: media.mime_type || '',
      bytes: media.bytes || '',
      size: media.size || 0
    };
  }

  /**
   * Determine if a node is final (has no children or connections)
   */
  private static isNodeFinal(node: Node): boolean {
    const hasChildren = node.children && node.children.length > 0;
    const hasButtonConnections = node.buttonConnections &&
      Object.keys(node.buttonConnections).length > 0;

    return !hasChildren && !hasButtonConnections;
  }

  /**
   * Determine next_nodes value for a node
   */
  private static determineNextNodes(node: Node): string | null {
    // For message and question nodes, use the first child
    if (node.type === 'message' || node.type === 'question') {
      return node.children.length > 0 ? node.children[0].id : null;
    }

    // For interactive button nodes, use the first button connection or first child
    if (node.type === 'interactive_buttons') {
      // First try to get from buttonConnections
      if (node.buttonConnections) {
        const buttonIndices = Object.keys(node.buttonConnections)
          .map(key => parseInt(key))
          .sort((a, b) => a - b);

        if (buttonIndices.length > 0) {
          return node.buttonConnections[buttonIndices[0]];
        }
      }

      // Fall back to existing next_nodes or first child
      return node.next_nodes || (node.children.length > 0 ? node.children[0].id : null);
    }

    // For operation nodes, use the first child (single connection like message nodes)
    if (node.type === 'operation') {
      return node.children.length > 0 ? node.children[0].id : (node.next_nodes || null);
    }

    return null;
  }

  /**
   * Get all nodes in a flat array
   */
  private static getAllNodesFlat(nodes: Node[]): Node[] {
    const allNodes: Node[] = [];
    const visited = new Set<string>();
    const queue = [...nodes];

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) {
        continue;
      }

      visited.add(node.id);
      allNodes.push(node);

      // Add unvisited children to queue
      const unvisitedChildren = node.children.filter(child => !visited.has(child.id));
      queue.push(...unvisitedChildren);
    }

    return allNodes;
  }

  /**
   * FIXED: Override serializeNode to pass node to cleanNodeBody
   */
  private static serializeNode(node: Node): SerializedNode {
    // Extract service_hook from body and place it at the node level
    // where the backend DynamicFlowNodeRequest expects it
    const body = this.cleanNodeBody(node.body, node);
    let serviceHook: any = null;
    if ((body as any).service_hook) {
      serviceHook = (body as any).service_hook;
      delete (body as any).service_hook; // Remove from body
    }

    return {
      id: node.id,
      type: node.type,
      title: node.title,
      body,
      position: { ...node.position },
      is_first: node.is_first || false,
      is_final: this.isNodeFinal(node),
      next_nodes: this.determineNextNodes(node),
      service_hook: serviceHook,
    };
  }

  /**
   * Comprehensive node validation
   */
  static validateNodes(nodes: Node[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const node of nodes) {
      // Validate basic node structure
      if (!node.id) {
        errors.push({
          nodeId: node.id || 'unknown',
          field: 'id',
          message: 'Node ID is required',
          severity: 'error'
        });
      }

      if (!node.type) {
        errors.push({
          nodeId: node.id,
          field: 'type',
          message: 'Node type is required',
          severity: 'error'
        });
      }

      // Validate node-specific content
      this.validateNodeContent(node, errors, warnings);
    }

    // Validate flow structure
    this.validateFlowStructure(nodes, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate node-specific content
   */
  private static validateNodeContent(
    node: Node,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    switch (node.type) {
      case 'message':
        this.validateMessageNode(node, errors, warnings);
        break;
      case 'question':
        this.validateQuestionNode(node, errors, warnings);
        break;
      case 'interactive_buttons':
        this.validateInteractiveButtonsNode(node, errors, warnings);
        break;
    }
  }

  /**
   * Validate message node
   */
  private static validateMessageNode(
    node: Node,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const messageBody = node.body.body_message;

    if (!messageBody) {
      errors.push({
        nodeId: node.id,
        field: 'body_message',
        message: 'Message body is required',
        severity: 'error'
      });
      return;
    }

    if (!messageBody.content_items || messageBody.content_items.length === 0) {
      warnings.push({
        nodeId: node.id,
        field: 'content_items',
        message: 'Message node has no content items'
      });
      return;
    }

    // Validate each content item
    messageBody.content_items.forEach((item, index) => {
      if (item.type === 'text' && !item.content.text_body?.trim()) {
        errors.push({
          nodeId: node.id,
          field: `content_items[${index}].text_body`,
          message: 'Text content cannot be empty',
          severity: 'error'
        });
      }

      if (item.type !== 'text' && (!item.content.bytes || !item.content.mime_type)) {
        errors.push({
          nodeId: node.id,
          field: `content_items[${index}].media`,
          message: `Media content is incomplete for ${item.type} item`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Validate question node
   */
  private static validateQuestionNode(
    node: Node,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const questionBody = node.body.body_question;

    if (!questionBody) {
      errors.push({
        nodeId: node.id,
        field: 'body_question',
        message: 'Question body is required',
        severity: 'error'
      });
      return;
    }

    if (!questionBody.question_text?.trim()) {
      errors.push({
        nodeId: node.id,
        field: 'question_text',
        message: 'Question text is required',
        severity: 'error'
      });
    }

    if (questionBody.save_to_variable && !questionBody.variable_name?.trim()) {
      errors.push({
        nodeId: node.id,
        field: 'variable_name',
        message: 'Variable name is required when save_to_variable is true',
        severity: 'error'
      });
    }
  }

  /**
   * ENHANCED: Validate interactive buttons node with button connections
   */
  private static validateInteractiveButtonsNode(
    node: Node,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const buttonBody = node.body.body_button;

    if (!buttonBody) {
      errors.push({
        nodeId: node.id,
        field: 'body_button',
        message: 'Button body is required',
        severity: 'error'
      });
      return;
    }

    if (!buttonBody.body?.text?.trim()) {
      errors.push({
        nodeId: node.id,
        field: 'body.text',
        message: 'Button body text is required',
        severity: 'error'
      });
    }

    if (!buttonBody.action?.buttons || buttonBody.action.buttons.length === 0) {
      errors.push({
        nodeId: node.id,
        field: 'action.buttons',
        message: 'At least one button is required',
        severity: 'error'
      });
      return;
    }

    if (buttonBody.action.buttons.length > 3) {
      errors.push({
        nodeId: node.id,
        field: 'action.buttons',
        message: 'Maximum 3 buttons allowed',
        severity: 'error'
      });
    }

    // Validate each button
    buttonBody.action.buttons.forEach((button, index) => {
      if (!button.reply?.id?.trim()) {
        errors.push({
          nodeId: node.id,
          field: `action.buttons[${index}].reply.id`,
          message: `Button ${index + 1} ID is required`,
          severity: 'error'
        });
      }

      if (!button.reply?.title?.trim()) {
        errors.push({
          nodeId: node.id,
          field: `action.buttons[${index}].reply.title`,
          message: `Button ${index + 1} title is required`,
          severity: 'error'
        });
      }

      // FIXED: Validate button connections
      const hasConnection = node.buttonConnections?.[index];
      if (!hasConnection) {
        warnings.push({
          nodeId: node.id,
          field: `action.buttons[${index}].connection`,
          message: `Button ${index + 1} ("${button.reply?.title}") is not connected to any node`
        });
      }
    });

    // Validate header media if present
    if (buttonBody.header?.type === 'media' && buttonBody.header.media) {
      if (!buttonBody.header.media.bytes || !buttonBody.header.media.mime_type) {
        errors.push({
          nodeId: node.id,
          field: 'header.media',
          message: 'Header media is incomplete',
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate overall flow structure
   */
  private static validateFlowStructure(
    nodes: Node[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for at least one starting node
    const startingNodes = nodes.filter(node => node.is_first);
    if (startingNodes.length === 0) {
      warnings.push({
        nodeId: 'flow',
        field: 'structure',
        message: 'No starting node found in flow'
      });
    }

    if (startingNodes.length > 1) {
      warnings.push({
        nodeId: 'flow',
        field: 'structure',
        message: 'Multiple starting nodes found'
      });
    }

    // Check for orphaned nodes
    const referencedNodeIds = new Set<string>();
    nodes.forEach(node => {
      node.children.forEach(child => referencedNodeIds.add(child.id));
      if (node.buttonConnections) {
        Object.values(node.buttonConnections).forEach(targetId => {
          if (targetId) referencedNodeIds.add(targetId);
        });
      }
    });

    const orphanedNodes = nodes.filter(node =>
      !node.is_first && !referencedNodeIds.has(node.id)
    );

    orphanedNodes.forEach(node => {
      warnings.push({
        nodeId: node.id,
        field: 'structure',
        message: 'Node is not reachable from flow start'
      });
    });
  }

  /**
   * Debug utility to log serialization details
   */
  static debugSerialization(nodes: Node[]): void {
    console.group('🔍 Chatbot Flow Serialization Debug');

    const allNodes = this.getAllNodesFlat(nodes);
    const serialized = this.prepareNodesForSubmission(nodes);
    const validation = this.validateNodes(allNodes);

    console.table({
      'Total Nodes': allNodes.length,
      'Message Nodes': allNodes.filter(n => n.type === 'message').length,
      'Question Nodes': allNodes.filter(n => n.type === 'question').length,
      'Button Nodes': allNodes.filter(n => n.type === 'interactive_buttons').length,
      'Starting Nodes': allNodes.filter(n => n.is_first).length,
      'Final Nodes': serialized.filter(n => n.is_final).length
    });

    // FIXED: Debug button connections
    const buttonNodes = allNodes.filter(n => n.type === 'interactive_buttons');
    if (buttonNodes.length > 0) {
      buttonNodes.forEach(node => {
        if (node.buttonConnections) {
          Object.entries(node.buttonConnections).forEach(([buttonIndex, targetId]) => {
            const buttonTitle = node.body.body_button?.action?.buttons?.[parseInt(buttonIndex)]?.reply?.title;
          });
        } else {
        }
      });
    }

    console.groupEnd();
  }
}
