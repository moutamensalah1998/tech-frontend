export interface businessProfileModel {

    success: string,
    message: string,
    status_code: number,
    data: {
        business_profile: {
            data: {
                about: string | null,
                address: string | null,
                description: string | null,
                email: string | null,
                websites: [
                    string, string
                ] | null,
                vertical: string | null,
                messaging_product: string,
                profile_picture_url: string | null,
            }[],
            phone_number: string
        }
    }
}

export enum BusinessProfileIndustryEnum {
    OTHER = "others",
    AUTO = "automotive",
    BEAUTY = "beauty-spa-salon",
    APPAREL = "clothing-apparel",
    EDU = "education",
    ENTERTAIN = "entertainment",
    EVENT_PLAN = "event-planning-service",
    FINANCE = "finance-banking",
    HOTEL = "hotel-lodging",
    HEALTH = "medical-health",
    NONPROFIT = "non-profit",
    PROF_SERVICES = "professional-services",
    RETAIL = "shopping-retail",
    TRAVEL = "travel-transportation",
    RESTAURANT = "restaurant",
}
