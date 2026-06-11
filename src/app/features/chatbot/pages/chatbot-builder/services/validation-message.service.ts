import { Injectable, inject } from '@angular/core';
import { ValidationError, ValidationWarning } from '../../../../../core/services/chatbot/utility';
import { TranslationService } from '../../../../../core/services/translation/translation.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationMessageService {
  private translationService = inject(TranslationService);
  /**
   * Format validation errors into user-friendly messages
   */
  formatValidationErrors(errors: ValidationError[]): string[] {
    if (!errors || errors.length === 0) {
      return [];
    }

    // Group errors by node and field for better readability
    const groupedErrors = this.groupErrorsByNode(errors);
    const messages: string[] = [];

    for (const [nodeId, nodeErrors] of groupedErrors.entries()) {
      const nodeMessages = this.formatNodeErrors(nodeId, nodeErrors);
      messages.push(...nodeMessages);
    }

    return messages;
  }

  /**
   * Format validation warnings into user-friendly messages
   */
  formatValidationWarnings(warnings: ValidationWarning[]): string[] {
    if (!warnings || warnings.length === 0) {
      return [];
    }

    const messages: string[] = [];
    for (const warning of warnings) {
      const message = this.formatWarningMessage(warning);
      if (message) {
        messages.push(message);
      }
    }

    return messages;
  }

  /**
   * Get a single, clear error message for display
   */
  getPrimaryErrorMessage(errors: ValidationError[]): string | null {
    if (!errors || errors.length === 0) {
      return null;
    }

    // Prioritize critical errors
    const criticalErrors = errors.filter(e =>
      e.field === 'id' ||
      e.field === 'type' ||
      e.message.includes('required') ||
      e.message.includes('missing')
    );

    if (criticalErrors.length > 0) {
      return this.formatSingleError(criticalErrors[0]);
    }

    return this.formatSingleError(errors[0]);
  }

  /**
   * Format connection validation error
   */
  formatConnectionError(error: string): string {
    const errorMap: Record<string, string> = {
      'Cannot connect node to itself': 'You cannot connect a node to itself',
      'Button is already connected to this node': 'This button is already connected to that node',
      'Button index out of range': 'Invalid button selection',
      'Connection already exists': 'These nodes are already connected'
    };

    return errorMap[error] || error;
  }

  /**
   * Format form field error
   */
  formatFormFieldError(fieldName: string, errorType: string, errorValue?: any): string {
    const fieldLabels: Record<string, string> = {
      'title': 'Node title',
      'text': 'Message text',
      'question_text': 'Question text',
      'variable_name': 'Variable name',
      'button_title': 'Button title',
      'button_id': 'Button ID'
    };

    const label = fieldLabels[fieldName] || fieldName;

    switch (errorType) {
      case 'required':
        return `${label} is required`;
      case 'maxlength':
        return `${label} is too long (maximum ${errorValue?.requiredLength || 'unknown'} characters)`;
      case 'minlength':
        return `${label} is too short (minimum ${errorValue?.requiredLength || 'unknown'} characters)`;
      case 'requiredText':
        return `${label} cannot be empty`;
      case 'invalidVariableName':
        return 'Variable name can only contain letters, numbers, and underscores';
      default:
        return `${label} is invalid`;
    }
  }

  private groupErrorsByNode(errors: ValidationError[]): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();

    for (const error of errors) {
      const nodeId = error.nodeId || 'unknown';
      if (!grouped.has(nodeId)) {
        grouped.set(nodeId, []);
      }
      grouped.get(nodeId)!.push(error);
    }

    return grouped;
  }

  private formatNodeErrors(nodeId: string, errors: ValidationError[]): string[] {
    const messages: string[] = [];

    // Group by field type
    const requiredErrors = errors.filter(e => e.message.includes('required') || e.message.includes('missing'));
    const contentErrors = errors.filter(e =>
      e.field.includes('content') ||
      e.field.includes('text') ||
      e.field.includes('media')
    );
    const buttonErrors = errors.filter(e => e.field.includes('button'));
    const otherErrors = errors.filter(e =>
      !requiredErrors.includes(e) &&
      !contentErrors.includes(e) &&
      !buttonErrors.includes(e)
    );

    // Format required errors
    if (requiredErrors.length > 0) {
      const requiredFields = requiredErrors.map(e => this.getFieldLabel(e.field));
      if (requiredFields.length === 1) {
        messages.push(`${requiredFields[0]} is required`);
      } else {
        messages.push(`Missing required fields: ${requiredFields.join(', ')}`);
      }
    }

    // Format content errors
    for (const error of contentErrors) {
      messages.push(this.formatSingleError(error));
    }

    // Format button errors
    if (buttonErrors.length > 0) {
      const buttonMessages = this.formatButtonErrors(buttonErrors);
      messages.push(...buttonMessages);
    }

    // Format other errors
    for (const error of otherErrors) {
      messages.push(this.formatSingleError(error));
    }

    return messages;
  }

  private formatButtonErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    const buttonIndexMap = new Map<number, ValidationError[]>();

    // Group by button index
    for (const error of errors) {
      const match = error.field.match(/buttons\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        if (!buttonIndexMap.has(index)) {
          buttonIndexMap.set(index, []);
        }
        buttonIndexMap.get(index)!.push(error);
      } else {
        messages.push(this.formatSingleError(error));
      }
    }

    // Format grouped button errors
    for (const [index, buttonErrors] of buttonIndexMap.entries()) {
      const buttonNum = index + 1;
      const errorTypes = buttonErrors.map(e => {
        if (e.field.includes('title')) return 'title';
        if (e.field.includes('id')) return 'ID';
        return 'details';
      });

      if (errorTypes.includes('title') && errorTypes.includes('ID')) {
        messages.push(`Button ${buttonNum} is missing title and ID`);
      } else if (errorTypes.includes('title')) {
        messages.push(`Button ${buttonNum} is missing a title`);
      } else if (errorTypes.includes('ID')) {
        messages.push(`Button ${buttonNum} is missing an ID`);
      } else {
        messages.push(`Button ${buttonNum} has invalid ${errorTypes.join(' and ')}`);
      }
    }

    return messages;
  }

  private formatSingleError(error: ValidationError): string {
    const fieldLabel = this.getFieldLabel(error.field);

    // Map common error messages to user-friendly versions using translations
    const messageMap: Record<string, string> = {
      'Node ID is required': this.translationService.translate('validation.nodeIdRequired'),
      'Node type is required': this.translationService.translate('validation.nodeTypeRequired'),
      'Message body is required': this.translationService.translate('validation.messageBodyRequired'),
      'Question body is required': this.translationService.translate('validation.questionBodyRequired'),
      'Button body is required': this.translationService.translate('validation.buttonBodyRequired'),
      'Button body text is required': this.translationService.translate('validation.buttonBodyTextRequired'),
      'At least one button is required': this.translationService.translate('validation.addAtLeastOneButton'),
      'Maximum 3 buttons allowed': this.translationService.translate('validation.maximum3Buttons'),
      'Question text is required': this.translationService.translate('validation.questionTextRequired'),
      'Text content cannot be empty': this.translationService.translate('validation.textContentCannotBeEmpty'),
      'Variable name is required when save_to_variable is true': this.translationService.translate('validation.variableNameRequired'),
      'Media content is incomplete': this.translationService.translate('validation.mediaContentIncomplete'),
      'Header text is required when header type is text': this.translationService.translate('validation.headerTextRequired'),
      'Header media is required when header type is media': this.translationService.translate('validation.headerMediaRequired')
    };

    if (messageMap[error.message]) {
      return messageMap[error.message];
    }

    // Generic formatting
    if (error.message.includes('required')) {
      const requiredText = this.translationService.translate('chatbot.builder.shared.formField.fieldRequired');
      return `${fieldLabel} ${requiredText}`;
    }

    return error.message;
  }

  private formatWarningMessage(warning: ValidationWarning): string | null {
    const messageMap: Record<string, string> = {
      'Message node has no content items': this.translationService.translate('validation.messageNodeNoContent'),
      'No starting node found in flow': this.translationService.translate('validation.noStartingNode'),
      'Multiple starting nodes found': this.translationService.translate('validation.multipleStartingNodes'),
      'Node is not reachable from flow start': this.translationService.translate('validation.nodeNotReachable')
    };

    if (messageMap[warning.message]) {
      return messageMap[warning.message];
    }

    // Format button connection warnings
    if (warning.message.includes('not connected')) {
      return warning.message.replace('Button', 'Button').replace('is not connected to any node', this.translationService.translate('validation.buttonNotConnected'));
    }

    return warning.message;
  }

  private getFieldLabel(field: string): string {
    const fieldMap: Record<string, string> = {
      'id': 'Node ID',
      'type': 'Node type',
      'body_message': 'Message content',
      'body_question': 'Question content',
      'body_button': 'Button content',
      'body.text': 'Message text',
      'question_text': 'Question text',
      'variable_name': 'Variable name',
      'content_items': 'Message content',
      'action.buttons': 'Buttons',
      'header.text': 'Header text',
      'header.media': 'Header image'
    };

    // Check for indexed fields
    if (field.includes('[') && field.includes(']')) {
      const match = field.match(/(.+)\[(\d+)\](.+)?/);
      if (match) {
        const baseField = match[1];
        const index = parseInt(match[2]) + 1;
        const subField = match[3] || '';

        if (baseField.includes('button')) {
          return `Button ${index}${subField ? ' ' + this.getFieldLabel(subField) : ''}`;
        }
        if (baseField.includes('content')) {
          return `Content item ${index}${subField ? ' ' + this.getFieldLabel(subField) : ''}`;
        }
      }
    }

    return fieldMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

