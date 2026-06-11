export interface AttributeModel {
    attributes: Attribute[];
    total_count: number;
    total_pages: number;
    limit: number;
    page: number;
}

export interface Attribute {
    id: string;
    name: string;
}

