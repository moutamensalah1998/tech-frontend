

export interface ContactModel {
    id: string;
    name: string;
    country_code: string;
    phone_number: string;
    status: string;
    allow_broadcast: boolean;
    allow_sms: boolean;
    tag_links: any[];
    attribute_links: any[];
}

export interface ContactUpdateRequest {
    id: string;
    name: string;
    phone_number: string;
    source: string;
    allow_broadcast: boolean;
    allow_sms: boolean;
    contact_attributes: {
        name: string;
        value: string;
    }[];
    contact_tags: {
        name: string;
    }[];
}

export interface ContactFile{
    id: string;
    name: string;
    country_code: string;
    phone_number: string;
}