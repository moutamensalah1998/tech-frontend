import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Node } from '../../../../../core/models/chatbot.model';
import { FlowTransformationUtility } from '../utils/flow-transformation.utility';
import { MediaDownloadService } from './media-download.service';
import { ToastService } from '../../../../../core/services/toast-message.service';
import { ChatbotFlowResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class FlowLoaderService {
  constructor(
    private mediaDownloadService: MediaDownloadService,
    private toastService: ToastService
  ) {}

  /**
   * Load flow from API response
   */
  loadFlowFromApi(flowResponse: ChatbotFlowResponse): Observable<{
    nodes: Node[];
    chatbotInfo?: {
      name: string;
      language: string;
      version: number;
    };
  }> {
    return from(this.transformFlow(flowResponse)).pipe(
      map(result => result),
      catchError(error => {
        this.toastService.showToast('Failed to load chatbot flow', 'error');
        return of({ nodes: [] });
      })
    );
  }

  /**
   * Validate flow response
   */
  validateFlow(flowResponse: ChatbotFlowResponse): boolean {
    return FlowTransformationUtility.validateApiResponse(flowResponse);
  }

  /**
   * Transform API response to internal node format
   */
  private async transformFlow(flowResponse: ChatbotFlowResponse): Promise<{
    nodes: Node[];
    chatbotInfo?: {
      name: string;
      language: string;
      version: number;
    };
  }> {
    if (!this.validateFlow(flowResponse)) {
      this.toastService.showToast('Invalid flow data received', 'error');
      return { nodes: [] };
    }

    const mediaInfo = FlowTransformationUtility.hasMediaInResponse(flowResponse);
    if (mediaInfo.hasMedia) {
      const downloadMessage = FlowTransformationUtility.getMediaDownloadMessage(mediaInfo);
      this.toastService.showToast(downloadMessage, 'info');
    }

    const convertedNodes: Node[] = [];
    for (const apiNode of flowResponse.nodes) {
      const node = await FlowTransformationUtility.convertApiNodeToInternalNode(
        apiNode,
        this.mediaDownloadService
      );
      convertedNodes.push(node);
    }

    FlowTransformationUtility.rebuildNodeConnections(convertedNodes);

    if (mediaInfo.hasMedia) {
      this.toastService.showToast(
        `Flow loaded with ${mediaInfo.mediaCount} media files converted`,
        'success'
      );
    }

    const chatbotInfo = flowResponse.chatbot ? {
      name: flowResponse.chatbot.name,
      language: flowResponse.chatbot.language,
      version: flowResponse.chatbot.version
    } : undefined;

    return { nodes: convertedNodes, chatbotInfo };
  }
}

