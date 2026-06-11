import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NodeTemplate, PREDEFINED_TEMPLATES } from '../constants/node-templates';
import { FlowNodeType, Node } from '../../../../../core/models/chatbot.model';
import { uuidv7 } from 'uuidv7';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly STORAGE_KEY = 'chatbot_custom_templates';
  private templatesSubject = new BehaviorSubject<NodeTemplate[]>([]);
  
  templates$: Observable<NodeTemplate[]> = this.templatesSubject.asObservable();

  constructor() {
    this.loadTemplates();
  }

  get allTemplates(): NodeTemplate[] {
    return [...PREDEFINED_TEMPLATES, ...this.templatesSubject.value];
  }

  getTemplatesByType(type: FlowNodeType): NodeTemplate[] {
    return this.allTemplates.filter(t => t.type === type);
  }

  getTemplatesByCategory(category: string): NodeTemplate[] {
    return this.allTemplates.filter(t => t.category === category);
  }

  searchTemplates(query: string): NodeTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.allTemplates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.preview.toLowerCase().includes(lowerQuery)
    );
  }

  saveCustomTemplate(template: Omit<NodeTemplate, 'id' | 'isCustom'>): void {
    const customTemplate: NodeTemplate = {
      ...template,
      id: uuidv7(),
      isCustom: true
    };

    const currentTemplates = this.templatesSubject.value;
    const updatedTemplates = [...currentTemplates, customTemplate];
    this.templatesSubject.next(updatedTemplates);
    this.saveToStorage();
  }

  deleteCustomTemplate(templateId: string): void {
    const currentTemplates = this.templatesSubject.value;
    const updatedTemplates = currentTemplates.filter(t => t.id !== templateId);
    this.templatesSubject.next(updatedTemplates);
    this.saveToStorage();
  }

  createNodeFromTemplate(template: NodeTemplate, position: { x: number; y: number }): Partial<Node> {
    return {
      type: template.type,
      title: template.name,
      body: template.data,
      position,
      is_first: false,
      is_final: false
    };
  }

  exportTemplates(): string {
    const customTemplates = this.templatesSubject.value;
    return JSON.stringify(customTemplates, null, 2);
  }

  importTemplates(json: string): boolean {
    try {
      const templates = JSON.parse(json) as NodeTemplate[];
      if (!Array.isArray(templates)) {
        return false;
      }

      // Validate templates
      const validTemplates = templates.filter(t => 
        t.name && t.type && t.data
      );

      const currentTemplates = this.templatesSubject.value;
      this.templatesSubject.next([...currentTemplates, ...validTemplates]);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return false;
    }
  }

  private loadTemplates(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const templates = JSON.parse(saved) as NodeTemplate[];
        this.templatesSubject.next(templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templatesSubject.value));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }
}

