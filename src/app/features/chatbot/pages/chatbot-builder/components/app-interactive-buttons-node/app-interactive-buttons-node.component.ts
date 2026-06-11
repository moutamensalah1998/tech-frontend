// app-interactive-buttons-node.component.ts - Updated to support video and documents in header
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  FormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';

import { takeUntil } from 'rxjs';
import { DragDropService } from './../../services/drag-drop.service';
import { NodeManagementService } from './../../services/node-management.service';
import { SelectionService } from './../../services/selection.service';
import { NodeHeaderComponent } from './../../shared/node-header/node-header.component';
import { BaseNodeComponent } from '../base/base-node.component';
import { MediaUploadResult } from '../../services/media-upload.service';
import { NodeValidators } from '../../validators/node.validators';
import { MediaUploadComponent } from "../../shared/media-upload/media-upload.component";
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

interface ButtonFormData {
  id: string;
  title: string;
  next_node_id?: string;
}

interface HeaderFormData {
  type: 'text' | 'media';
  text: string;
  mediaType: 'image' | 'video' | 'document'; // Added mediaType field
}

interface FooterFormData {
  text: string;
}

interface MainFormData {
  type: 'button';
  bodyText: string;
  buttons: ButtonFormData[];
}

@Component({
  selector: 'app-interactive-buttons-node',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NodeHeaderComponent,
    MediaUploadComponent,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-interactive-buttons-node.component.html',
})
export class InteractiveButtonsNodeComponent
  extends BaseNodeComponent
  implements OnInit {
  @Output() override onConnectionStart = new EventEmitter<any>();
  private translationService = inject(TranslationService);

  buttonsForm!: FormGroup<{
    type: FormControl<'button'>;
    bodyText: FormControl<string>;
    buttons: FormArray<FormGroup<{
      id: FormControl<string>;
      title: FormControl<string>;
    }>>;
  }>;

  headerFormGroup!: FormGroup<{
    type: FormControl<'text' | 'media'>;
    text: FormControl<string>;
    mediaType: FormControl<'image' | 'video' | 'document'>; // Added mediaType control
  }>;

  footerFormGroup!: FormGroup<{
    text: FormControl<string>;
  }>;

  headerEnabled = false;
  footerEnabled = false;
  headerMediaResult: MediaUploadResult | null = null;

  readonly typeOptions = [{ value: 'button' as const, label: 'Button' }];

  // Added media type options for header
  readonly headerMediaTypeOptions = [
    { value: 'image' as const, label: 'Image', icon: 'image' },
    { value: 'video' as const, label: 'Video', icon: 'videocam' },
    { value: 'document' as const, label: 'Document', icon: 'description' }
  ];

  constructor(
    dragDropService: DragDropService,
    nodeManagementService: NodeManagementService,
    private fb: FormBuilder,
    cdr: ChangeDetectorRef,
    private toast: ToastService,
    selectionService: SelectionService
  ) {
    super(dragDropService, nodeManagementService, cdr, selectionService);
    this.initializeForms();
  }

  get buttonsFormArray(): FormArray<FormGroup<{
    id: FormControl<string>;
    title: FormControl<string>;
  }>> {
    return this.buttonsForm.controls.buttons;
  }

  get footerTextControl(): FormControl<string> {
    return this.footerFormGroup.controls.text;
  }

  get currentHeaderMediaType(): 'image' | 'video' | 'document' {
    return this.headerFormGroup.controls.mediaType.value;
  }

  // Added method to get current media type label
  getCurrentMediaTypeLabel(): string {
    const currentType = this.currentHeaderMediaType;
    return this.headerMediaTypeOptions.find(opt => opt.value === currentType)?.label || 'Media';
  }

  // Added method to get current media type icon
  getCurrentMediaTypeIcon(): string {
    const currentType = this.currentHeaderMediaType;
    return this.headerMediaTypeOptions.find(opt => opt.value === currentType)?.icon || 'attachment';
  }

  protected initializeNode(): void {
    if (!this.node.body.body_button) {
      this.node.body.body_button = {
        type: 'button',
        body: { text: '' },
        action: { buttons: [] },
      };
    }

    this.initializeFormValues();
    this.setupFormSubscriptions();
  }

  private initializeForms(): void {
    this.buttonsForm = this.fb.nonNullable.group({
      type: ['button' as const],
      bodyText: ['', [Validators.required, NodeValidators.maxLength(1024)]],
      buttons: this.fb.array<FormGroup<{
        id: FormControl<string>;
        title: FormControl<string>;
      }>>([]),
    });

    this.headerFormGroup = this.fb.nonNullable.group({
      type: ['text' as 'text' | 'media'],
      text: ['', [NodeValidators.maxLength(60)]],
      mediaType: ['image' as 'image' | 'video' | 'document'], // Added mediaType with default
    });

    this.footerFormGroup = this.fb.nonNullable.group({
      text: ['', [NodeValidators.maxLength(60)]],
    });
  }

  // Updated to handle different media types for header
  onHeaderMediaUploaded(result: MediaUploadResult): void {
    this.headerMediaResult = result;

    if (this.node.body.body_button) {
      this.node.body.body_button.header = {
        type: 'media',
        media: {
          filename: result.fileName,
          mime_type: result.mimeType,
          bytes: result.base64Data,
          size: result.size
        }
      };
    }

    this.emitContentChange();
    this.cdr.markForCheck();
  }

  onHeaderMediaRemoved(): void {
    this.headerMediaResult = null;

    if (this.node.body.body_button?.header) {
      this.node.body.body_button.header = {
        type: 'text',
        text: this.headerFormGroup.value.text || ''
      };
    }

    this.emitContentChange();
    this.cdr.markForCheck();
  }

  onHeaderMediaError(error: string): void {
    this.toast.showToast(`Header media upload error: ${error}`, 'error');
  }

  // Added method to handle media type changes
  onHeaderMediaTypeChange(): void {
    // Clear existing media when changing type
    if (this.headerMediaResult) {
      this.headerMediaResult = null;
      if (this.node.body.body_button?.header?.type === 'media') {
        this.node.body.body_button.header = {
          type: 'text',
          text: this.headerFormGroup.value.text || ''
        };
      }
    }
    this.emitContentChange();
    this.cdr.markForCheck();
  }

  getHeaderMediaValue(): MediaUploadResult | undefined {
    if (!this.hasHeaderMedia()) return undefined;
    const media = this.node.body.body_button?.header?.media;
    if (!media) return undefined;

    let previewUrl = (media as any).preview_url;
    if (media.bytes && media.mime_type && !previewUrl) {
      previewUrl = `data:${media.mime_type};base64,${media.bytes}`;
    }

    return {
      fileName: media.filename || '',
      mimeType: media.mime_type || '',
      base64Data: media.bytes || '',
      size: media.size || 0,
      previewUrl: previewUrl,
      thumbnailUrl: (media as any).thumbnail_url
    };
  }

  hasHeaderMedia(): boolean {
    return !!(
      this.node.body.body_button?.header?.type === 'media' &&
      this.node.body.body_button?.header?.media &&
      (this.node.body.body_button.header.media.bytes || (this.node.body.body_button.header.media as any).preview_url)
    );
  }

  // Updated to detect media type from stored data
  getStoredHeaderMediaType(): 'image' | 'video' | 'document' {
    if (!this.node.body.body_button?.header) return 'image';

    const header = this.node.body.body_button.header;

    // If it's a media header with actual media data
    if (header.type === 'media' && header.media?.mime_type) {
      const mimeType = header.media.mime_type;

      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
      return 'image'; // Default to image
    }

    // If it's a legacy media type header (like "document", "video", "image")
    if (['document', 'video', 'image'].includes(header.type!)) {
      return header.type as 'image' | 'video' | 'document';
    }

    return 'image'; // Default fallback
  }

  getHeaderPreview(): boolean {
    if (this.headerFormGroup.value.type === 'text') {
      return !!(this.headerFormGroup.value.text);
    } else if (this.headerFormGroup.value.type === 'media') {
      return this.hasHeaderMedia();
    }
    return false;
  }

  // Updated to get appropriate max size based on media type
  getHeaderMediaMaxSize(): number {
    switch (this.currentHeaderMediaType) {
      case 'image': return 5;  // 5MB for images
      case 'video': return 15; // 15MB for videos
      case 'document': return 10; // 10MB for documents
      default: return 5;
    }
  }

  // Updated to get appropriate placeholder text
  getHeaderMediaPlaceholder(): string {
    switch (this.currentHeaderMediaType) {
      case 'image': return 'Upload header image';
      case 'video': return 'Upload header video';
      case 'document': return 'Upload header document';
      default: return 'Upload header media';
    }
  }

  // Rest of the methods remain the same...
  onButtonConnectionStart(event: MouseEvent | TouchEvent, buttonIndex: number): void {
    if (!this.canStartConnection()) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const buttonControl = this.buttonsFormArray.at(buttonIndex);
    const buttonId = buttonControl?.value.id || `button_${buttonIndex}`;
    const buttonTitle = buttonControl?.value.title || `Button ${buttonIndex + 1}`;

    const clientX = event instanceof MouseEvent ? event.clientX :
      event instanceof TouchEvent ? event.touches[0]?.clientX || 0 : 0;
    const clientY = event instanceof MouseEvent ? event.clientY :
      event instanceof TouchEvent ? event.touches[0]?.clientY || 0 : 0;

    const buttonEvent = {
      type: event.type,
      clientX,
      clientY,
      buttonIndex,
      buttonId,
      buttonTitle,
      sourceNodeId: this.node.id,
      sourceNodeType: this.node.type,
      originalEvent: event,
      stopPropagation: () => { },
      preventDefault: () => { }
    };

    this.onConnectionStart.emit(buttonEvent);
  }

  addButton(): void {
    if (this.buttonsFormArray.length >= 3) return;

    const buttonIndex = this.buttonsFormArray.length;
    const buttonGroup = this.fb.nonNullable.group({
      id: [`button_${buttonIndex + 1}_${Date.now()}`, [
        Validators.required,
        NodeValidators.maxLength(256)
      ]],
      title: [`Button ${buttonIndex + 1}`, [
        Validators.required,
        NodeValidators.maxLength(20),
        NodeValidators.requiredText()
      ]],
    });

    this.buttonsFormArray.push(buttonGroup);
    this.updateNodeButtons();
    this.cdr.markForCheck();
  }

  removeButton(index: number): void {
    if (index < 0 || index >= this.buttonsFormArray.length) return;

    if (this.node.buttonConnections?.[index]) {
      const newConnections = { ...this.node.buttonConnections };
      delete newConnections[index];
      const reindexedConnections: { [key: number]: string } = {};
      Object.entries(newConnections).forEach(([buttonIdx, targetId]) => {
        const idx = parseInt(buttonIdx);
        if (idx > index) {
          reindexedConnections[idx - 1] = targetId;
        } else {
          reindexedConnections[idx] = targetId;
        }
      });

      this.node.buttonConnections = reindexedConnections;
    }

    this.buttonsFormArray.removeAt(index);
    this.updateNodeButtons();
    this.emitContentChange();
    this.cdr.markForCheck();
  }

  getButtonsCount(): number {
    return this.buttonsFormArray.length;
  }

  hasButtonConnection(buttonIndex: number): boolean {
    return !!(this.node.buttonConnections?.[buttonIndex]);
  }

  getConnectionButtonTitle(buttonIndex: number): string {
    const buttonControl = this.buttonsFormArray.at(buttonIndex);
    const buttonTitle = buttonControl?.value.title || `Button ${buttonIndex + 1}`;
    const isConnected = this.hasButtonConnection(buttonIndex);
    const connectionInfo = isConnected ? ' (Connected)' : ' (Not connected)';
    return `Connect "${buttonTitle}" to next node${connectionInfo}`;
  }

  getConnectionsInfo(): string {
    const connections = Object.keys(this.node.buttonConnections || {});
    return connections.length > 0 ? `${connections.length} connected` : 'None';
  }

  hasInvalidButtons(): boolean {
    return this.buttonsFormArray.controls.some(control => control.invalid);
  }

  isFormValid(): boolean {
    return this.buttonsForm.valid &&
      this.getButtonsCount() > 0 &&
      !this.hasInvalidButtons();
  }

  getFormValidationErrors(): string[] {
    const errors: string[] = [];

    if (this.buttonsForm.get('bodyText')?.invalid) {
      errors.push(this.translationService.translate('chatbot.builder.nodes.interactiveButtons.messageTextRequired'));
    }

    if (this.getButtonsCount() === 0) {
      errors.push(this.translationService.translate('chatbot.builder.nodes.interactiveButtons.addAtLeastOneButton'));
    }

    if (this.hasInvalidButtons()) {
      const invalidCount = this.buttonsFormArray.controls.filter(
        control => !control.get('title')?.value?.trim() || !control.get('id')?.value?.trim()
      ).length;

      if (invalidCount > 0) {
        errors.push(`${invalidCount} button${invalidCount > 1 ? 's' : ''} ${invalidCount > 1 ? 'are' : 'is'} missing title or ID`);
      }
    }

    return errors;
  }

  toggleHeader(enabled: boolean): void {
    this.headerEnabled = enabled;

    if (!this.node.body.body_button) return;

    if (enabled) {
      this.node.body.body_button.header = {
        type: 'text',
        text: this.headerFormGroup.value.text || '',
      };
    } else {
      delete this.node.body.body_button.header;
      this.headerMediaResult = null;
    }

    this.emitContentChange();
    this.cdr.markForCheck();
  }

  toggleFooter(enabled: boolean): void {
    this.footerEnabled = enabled;

    if (!this.node.body.body_button) return;

    if (enabled) {
      this.node.body.body_button.footer = {
        text: this.footerFormGroup.value.text || ''
      };
    } else {
      delete this.node.body.body_button.footer;
    }

    this.emitContentChange();
    this.cdr.markForCheck();
  }

  private initializeFormValues(): void {
    const button = this.node.body.body_button!;

    this.buttonsForm.patchValue({
      type: button.type || 'button',
      bodyText: button.body?.text || '',
    });

    if (button.header) {
      this.headerEnabled = true;

      // Handle different header types properly
      let headerType: 'text' | 'media' = 'text';
      let mediaType: 'image' | 'video' | 'document' = 'image';

      if (button.header.type === 'text') {
        headerType = 'text';
      } else if (['media', 'image', 'video', 'document'].includes(button.header.type!)) {
        headerType = 'media';
        mediaType = this.getStoredHeaderMediaType();
      }

      this.headerFormGroup.patchValue({
        type: headerType,
        text: button.header.text || '',
        mediaType: mediaType,
      });

      // Only set media result if we have actual media data
      if (headerType === 'media' && button.header.media && button.header.media.bytes) {
        this.headerMediaResult = {
          fileName: button.header.media.filename || '',
          mimeType: button.header.media.mime_type || '',
          base64Data: button.header.media.bytes || '',
          size: button.header.media.size || 0
        };
      }
    }

    if (button.footer) {
      this.footerEnabled = true;
      this.footerFormGroup.patchValue({
        text: button.footer.text || '',
      });
    }

    this.buttonsFormArray.clear();
    button.action?.buttons?.forEach((btn, index) => {
      const buttonGroup = this.fb.nonNullable.group({
        id: [btn.reply?.id || `button_${index + 1}_${Date.now()}`, [
          Validators.required,
          NodeValidators.maxLength(256)
        ]],
        title: [btn.reply?.title || `Button ${index + 1}`, [
          Validators.required,
          NodeValidators.maxLength(20),
          NodeValidators.requiredText()
        ]],
      });
      this.buttonsFormArray.push(buttonGroup);
    });

    if (this.buttonsFormArray.length === 0) {
      this.addButton();
    }
  }

  private setupFormSubscriptions(): void {
    this.buttonsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateNodeFromForm();
      });

    this.headerFormGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.headerEnabled) {
          this.updateHeaderFromForm();
        }
      });

    this.footerFormGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.footerEnabled) {
          this.updateFooterFromForm();
        }
      });
  }

  private updateNodeFromForm(): void {
    if (!this.node.body.body_button) return;

    const formValue = this.buttonsForm.value;

    this.node.body.body_button.type = 'button';
    this.node.body.body_button.body.text = formValue.bodyText || '';

    this.updateNodeButtons();
    this.emitContentChange();
  }

  private updateHeaderFromForm(): void {
    if (!this.node.body.body_button || !this.headerEnabled) return;

    const headerValue = this.headerFormGroup.value;

    if (headerValue.type === 'text') {
      this.node.body.body_button.header = {
        type: 'text',
        text: headerValue.text || '',
      };
    }
    // Media header is updated through onHeaderMediaUploaded
    this.emitContentChange();
  }

  private updateFooterFromForm(): void {
    if (!this.node.body.body_button || !this.footerEnabled) return;

    this.node.body.body_button.footer = {
      text: this.footerFormGroup.value.text || '',
    };

    this.emitContentChange();
  }

  get buttons(): ButtonFormData[] {
    return this.buttonsFormArray.value as ButtonFormData[];
  }

  private updateNodeButtons(): void {
    if (!this.node.body.body_button) return;

    this.node.body.body_button.action.buttons = this.buttons.map(
      (btn) => ({
        type: 'reply' as const,
        reply: { id: btn.id, title: btn.title, next_node_id: btn.next_node_id }
      })
    );
  }

  protected validateContent(): boolean {
    if (!this.node.body.body_button) {
      return false;
    }

    const button = this.node.body.body_button;

    if (!button.body?.text?.trim()) {
      return false;
    }
    if (!button.action?.buttons || button.action.buttons.length === 0) {
      return false;
    }
    const hasInvalidButtons = button.action.buttons.some(btn =>
      !btn.reply?.title?.trim() || !btn.reply?.id?.trim()
    );

    if (hasInvalidButtons) {
      return false;
    }
    if (button.header) {
      if (button.header.type === 'text' && !button.header.text?.trim()) {
        return false;
      }
      if (button.header.type === 'media' && !button.header.media?.bytes) {
        return false;
      }
    }

    return true;
  }

  protected override getValidationErrorMessage(): string | null {
    if (!this.node.body.body_button) {
      return this.translationService.translate('chatbot.builder.nodes.interactiveButtons.buttonContentMissing');
    }

    const button = this.node.body.body_button;

    if (!button.body?.text?.trim()) {
      return this.translationService.translate('chatbot.builder.nodes.interactiveButtons.messageTextRequired');
    }

    if (!button.action?.buttons || button.action.buttons.length === 0) {
      return this.translationService.translate('chatbot.builder.nodes.interactiveButtons.addAtLeastOneButton');
    }

    const invalidButtons = button.action.buttons.filter(btn =>
      !btn.reply?.title?.trim() || !btn.reply?.id?.trim()
    );

    if (invalidButtons.length > 0) {
      const plural = invalidButtons.length > 1 ? 's' : '';
      const verb = invalidButtons.length > 1 ? 'are' : 'is';
      return this.translationService.translate('chatbot.builder.nodes.interactiveButtons.buttonsMissingTitleOrId', {
        count: invalidButtons.length,
        plural: plural,
        verb: verb
      });
    }

    if (button.header) {
      if (button.header.type === 'text' && !button.header.text?.trim()) {
        return this.translationService.translate('chatbot.builder.nodes.interactiveButtons.headerTextRequired');
      }
      if (button.header.type === 'media' && !button.header.media?.bytes) {
        return this.translationService.translate('chatbot.builder.nodes.interactiveButtons.headerImageRequired');
      }
    }

    return null;
  }

  protected getNodeDisplayName(): string {
    if (!this.node.body.body_button) {
      return `Interactive Buttons Node (${this.node.id.substring(0, 8)})`;
    }

    const button = this.node.body.body_button;
    const bodyText = button.body?.text?.trim();
    const buttonCount = button.action?.buttons?.length || 0;

    if (bodyText) {
      const truncated = bodyText.length > 25
        ? `${bodyText.substring(0, 25)}...`
        : bodyText;
      return `Buttons: "${truncated}" (${buttonCount} buttons)`;
    }

    if (buttonCount > 0) {
      const buttonTitles = button.action!.buttons!
        .map(btn => btn.reply?.title)
        .filter(title => title)
        .slice(0, 2);

      if (buttonTitles.length > 0) {
        const titleText = buttonTitles.join(', ');
        const moreText = buttonCount > 2 ? `, +${buttonCount - 2} more` : '';
        return `Buttons: ${titleText}${moreText}`;
      }
    }

    return `Interactive Buttons (${buttonCount} buttons)`;
  }
}
