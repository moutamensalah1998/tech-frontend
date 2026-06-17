import { Node, ContentItem, FlowNodeType } from '../../../../../core/models/chatbot.model';
import { MediaDownloadService } from '../services/media-download.service';
import { Injectable } from '@angular/core';

export interface ApiFlowNode {
  id: string;
  type: FlowNodeType;
  body: any;
  is_final: boolean;
  is_first: boolean;
  position: { x: number; y: number };
  next_nodes?: string | null;
  service_hook?: {
    service_type?: string;
    service_action?: string;
    user_id?: string;
    team_id?: string;
    on_success?: string;
    on_failure?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlowTransformationUtility {

  constructor(private mediaDownloadService: MediaDownloadService) {}

  static async convertApiNodesToInternalNodes(
    apiNodes: ApiFlowNode[],
    mediaDownloadService: MediaDownloadService
  ): Promise<Node[]> {
    const nodes: Node[] = [];

    for (const apiNode of apiNodes) {
      const node = await this.convertApiNodeToInternalNode(apiNode, mediaDownloadService);
      nodes.push(node);
    }

    return nodes;
  }

  static async convertApiNodeToInternalNode(
    apiNode: ApiFlowNode,
    mediaDownloadService?: MediaDownloadService
  ): Promise<Node> {
    const body = await this.convertApiBodyToInternalBody(apiNode.body, apiNode.type, mediaDownloadService);

    // Inject service_hook from the node-level into the body
    // The backend stores service_hook at node level; the frontend expects it in node.body
    if (apiNode.service_hook) {
      (body as any).service_hook = {
        service_type: apiNode.service_hook.service_type || '',
        service_action: apiNode.service_hook.service_action || '',
        user_id: apiNode.service_hook.user_id || '',
        team_id: apiNode.service_hook.team_id || '',
        on_success: apiNode.service_hook.on_success || '',
        on_failure: apiNode.service_hook.on_failure || '',
      };
    }

    const node: Node = {
      id: apiNode.id,
      type: apiNode.type,
      title: this.getNodeTitle(apiNode.type),
      body,
      position: {
        x: apiNode.position.x,
        y: apiNode.position.y
      },
      children: [],
      parents: [],
      parent: null,
      is_first: apiNode.is_first,
      is_final: apiNode.is_final,
      next_nodes: apiNode.next_nodes,
      buttonConnections: {}
    };

    return node;
  }

  private static async convertApiBodyToInternalBody(
    apiBody: any,
    nodeType: FlowNodeType,
    mediaDownloadService?: MediaDownloadService
  ): Promise<any> {
    switch (nodeType) {
      case 'message':
        return {
          body_message: {
            content_items: await this.convertContentItems(
              apiBody.body_message?.content_items || [],
              mediaDownloadService
            )
          }
        };

      case 'question':
        return {
          body_question: {
            question_text: apiBody.body_question?.question_text || '',
            answer_variant: apiBody.body_question?.answer_variant || '',
            accept_media_response: apiBody.body_question?.accept_media_response || false,
            save_to_variable: apiBody.body_question?.save_to_variable || false,
            variable_name: apiBody.body_question?.variable_name || ''
          }
        };

      case 'interactive_buttons':
        const buttonBody = {
          type: 'button' as const,
          header: apiBody.body_button?.header || undefined,
          body: {
            text: apiBody.body_button?.body?.text || ''
          },
          footer: apiBody.body_button?.footer || undefined,
          action: {
            buttons: apiBody.body_button?.action?.buttons || []
          }
        };

        if (buttonBody.header && this.isMediaHeaderType(buttonBody.header.type)) {
          const mediaData = buttonBody.header.media;

          if (mediaData?.cdn_url && mediaDownloadService) {
            try {

              const downloadResult = await mediaDownloadService.downloadAndConvertToBase64(
                mediaData.cdn_url,
                mediaData.file_name,
                mediaData.mime_type
              ).toPromise();

              if (downloadResult?.success && downloadResult.base64Data) {
                buttonBody.header = {
                  type: 'media',
                  media: {
                    filename: downloadResult.fileName || mediaData.file_name,
                    mime_type: downloadResult.mimeType || mediaData.mime_type,
                    bytes: downloadResult.base64Data,
                    size: downloadResult.size || 0
                  }
                };

                if (downloadResult.mimeType) {
                  (buttonBody.header.media as any).preview_url = `data:${downloadResult.mimeType};base64,${downloadResult.base64Data}`;
                }

                if (downloadResult.thumbnailUrl && downloadResult.mediaType === 'video') {
                  (buttonBody.header.media as any).thumbnail_url = downloadResult.thumbnailUrl;
                }

              } else {
                buttonBody.header.type = 'media';
                if (buttonBody.header.media && mediaData.mime_type) {
                  buttonBody.header.media.mime_type = mediaData.mime_type;
                }
              }
            } catch (error) {
              buttonBody.header.type = 'media';
              if (buttonBody.header.media && mediaData.mime_type) {
                buttonBody.header.media.mime_type = mediaData.mime_type;
              }

            }
          } else {
            if (buttonBody.header.text && buttonBody.header.text.trim()) {
              buttonBody.header = {
                type: 'text',
                text: buttonBody.header.text
              };
            } else {
              delete buttonBody.header;
            }
          }
        } else if (buttonBody.header && buttonBody.header.type === 'text') {
          buttonBody.header = {
            type: 'text',
            text: buttonBody.header.text || ''
          };
        }

        return { body_button: buttonBody };

      default:
        return apiBody;
    }
  }

  private static isMediaHeaderType(type: string): boolean {
    return ['image', 'video', 'audio', 'document', 'media'].includes(type);
  }

  private static async convertContentItems(
    apiContentItems: any[],
    mediaDownloadService?: MediaDownloadService
  ): Promise<ContentItem[]> {
    const convertedItems: ContentItem[] = [];
    for (let i = 0; i < apiContentItems.length; i++) {
      const apiItem = apiContentItems[i];
      const convertedItem: ContentItem = {
        type: apiItem.type,
        order: apiItem.order !== undefined ? apiItem.order : i,
        content: await this.convertContentItem(apiItem.content, apiItem.type, mediaDownloadService)
      };
      convertedItems.push(convertedItem);
    }
    return convertedItems;
  }

  private static async convertContentItem(
    apiContent: any,
    itemType: string,
    mediaDownloadService?: MediaDownloadService
  ): Promise<any> {
    const content: any = {};

    if (itemType === 'text') {
      content.text_body = apiContent.text_body || '';
    } else {
      if (apiContent.file_name) content.file_name = apiContent.file_name;
      if (apiContent.mime_type) content.mime_type = apiContent.mime_type;

      if (apiContent.cdn_url) {
        content.preview_url = apiContent.cdn_url;
      } else if (apiContent.url) {
        content.preview_url = apiContent.url;
      }

      if (apiContent.content_type) content.content_type = apiContent.content_type;
      if (apiContent.media_id) content.media_id = apiContent.media_id;
      if (apiContent.s3_key) content.s3_key = apiContent.s3_key;
      if (apiContent.caption) content.caption = apiContent.caption;
      if (apiContent.document_title) content.document_title = apiContent.document_title;
      if (apiContent.description) content.description = apiContent.description;

      if ((itemType === 'image' || itemType === 'video' || itemType === 'audio' || itemType === 'document')
          && apiContent.cdn_url && mediaDownloadService) {
        try {
          const downloadResult = await mediaDownloadService.downloadAndConvertToBase64(
            apiContent.cdn_url,
            apiContent.file_name,
            apiContent.mime_type
          ).toPromise();

          if (downloadResult?.success && downloadResult.base64Data) {
            content.bytes = downloadResult.base64Data;
            content.file_size = downloadResult.size;
            content.mime_type = downloadResult.mimeType || apiContent.mime_type;
            content.file_name = downloadResult.fileName || apiContent.file_name;
            if (downloadResult.mimeType) {
              content.preview_url = `data:${downloadResult.mimeType};base64,${downloadResult.base64Data}`;
            }
            if (itemType === 'video' && downloadResult.thumbnailUrl) {
              content.thumbnail_url = downloadResult.thumbnailUrl;
            }
          }
        } catch (error) {
          console.error(`Error converting content item media:`, error);
        }
      }
    }

    return content;
  }

  static rebuildNodeConnections(nodes: Node[]): void {
    const nodeMap = new Map<string, Node>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    nodes.forEach(node => {
      if (node.next_nodes) {
        const targetNode = nodeMap.get(node.next_nodes);
        if (targetNode) {
          if (!node.children.some(child => child.id === targetNode.id)) {
            node.children.push(targetNode);
          }

          if (!targetNode.parents) targetNode.parents = [];
          if (!targetNode.parents.some(parent => parent.id === node.id)) {
            targetNode.parents.push(node);
          }
        }
      }

      if (node.type === 'interactive_buttons' && node.body.body_button?.action?.buttons) {
        node.body.body_button.action.buttons.forEach((button, buttonIndex) => {
          const targetNodeId = button.reply?.next_node_id;
          if (targetNodeId) {
            const targetNode = nodeMap.get(targetNodeId);
            if (targetNode) {
              if (!node.buttonConnections) {
                node.buttonConnections = {};
              }

              node.buttonConnections[buttonIndex] = targetNodeId;

              if (!targetNode.parents) targetNode.parents = [];
              if (!targetNode.parents.some(parent => parent.id === node.id)) {
                targetNode.parents.push(node);
              }
            }
          }
        });
      }
    });
  }

  private static getNodeTitle(type: FlowNodeType): string {
    switch (type) {
      case 'message': return 'Send Message';
      case 'question': return 'Question';
      case 'interactive_buttons': return 'Interactive Buttons';
      default: return 'Node';
    }
  }

  static validateApiResponse(data: any): boolean {
    if (!data) {
      return false;
    }

    if (!Array.isArray(data.nodes)) {
      return false;
    }

    for (const node of data.nodes) {
      if (!node.id || !node.type || !node.position) {
        return false;
      }
    }

    return true;
  }

  static extractFlowStatistics(data: any): {
    totalNodes: number;
    hasMediaContent: boolean;
    complexityLevel: string;
  } {
    return {
      totalNodes: data.total_nodes || data.nodes?.length || 0,
      hasMediaContent: data.statistics?.has_media_content || false,
      complexityLevel: data.statistics?.complexity_level || 'simple'
    };
  }

  static hasMediaInResponse(flowResponse: any): {
    hasMedia: boolean;
    mediaCount: number;
    mediaTypes: string[];
  } {
    let mediaCount = 0;
    const mediaTypes = new Set<string>();

    flowResponse.nodes?.forEach((node: any) => {
      if (node.body?.body_message?.content_items) {
        node.body.body_message.content_items.forEach((item: any) => {
          if (item.type !== 'text' && item.content?.cdn_url) {
            mediaCount++;
            mediaTypes.add(item.type);
          }
        });
      }
      if (node.body?.body_button?.header) {
        const header = node.body.body_button.header;
        const isMediaHeader = this.isMediaHeaderType(header.type);

        if (isMediaHeader && header.media?.cdn_url) {
          mediaCount++;
          const mimeType = header.media.mime_type || '';

          if (mimeType.startsWith('image/') || header.type === 'image') {
            mediaTypes.add('image');
          } else if (mimeType.startsWith('video/') || header.type === 'video') {
            mediaTypes.add('video');
          } else if (mimeType.startsWith('audio/') || header.type === 'audio') {
            mediaTypes.add('audio');
          } else if (
            mimeType.startsWith('application/') ||
            mimeType.startsWith('text/') ||
            header.type === 'document'
          ) {
            mediaTypes.add('document');
          } else {
            const fileName = header.media.filename || header.media.file_name || '';
            const extension = fileName.split('.').pop()?.toLowerCase();

            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) {
              mediaTypes.add('image');
            } else if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv'].includes(extension || '')) {
              mediaTypes.add('video');
            } else if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension || '')) {
              mediaTypes.add('audio');
            } else {
              mediaTypes.add('document');
            }
          }
        }
      }
    });

    return {
      hasMedia: mediaCount > 0,
      mediaCount,
      mediaTypes: Array.from(mediaTypes)
    };
  }

  static getMediaDownloadMessage(mediaInfo: {
    hasMedia: boolean;
    mediaCount: number;
    mediaTypes: string[];
  }): string {
    if (!mediaInfo.hasMedia) {
      return '';
    }

    if (mediaInfo.mediaCount === 1) {
      return `Downloading 1 ${mediaInfo.mediaTypes[0]} file...`;
    }

    if (mediaInfo.mediaTypes.length === 1) {
      return `Downloading ${mediaInfo.mediaCount} ${mediaInfo.mediaTypes[0]} files...`;
    }

    const typesList = mediaInfo.mediaTypes.join(', ');
    return `Downloading ${mediaInfo.mediaCount} media files (${typesList})...`;
  }
}
