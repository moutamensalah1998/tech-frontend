import { PaginationData } from "./pagination.model";

export interface BaseResponse {
    success: boolean;
    message: string;
    status_code: number;
}

export interface Role {
    id: string;
    role_name: string;
}

export interface TeamUser {
    id: string;
    first_name: string;
    last_name: string;
}

export interface Team {
    id: string;
    name: string;
    users: TeamUser[];
}
export interface TeamUpdateModel {
    name: string;
    user_ids: string[];
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    online_status: boolean;
    is_base_admin: boolean;
    roles: Role[];
    teams: Team[];
    password: string | null;
}



export interface GetUsersResponse extends BaseResponse {
    data: {
        users: User[];
    } & PaginationData;
}

export interface GetTeamsResponse extends BaseResponse {
    data: {
        teams: Team[];
    } & PaginationData;
}

export interface GetRolesResponse extends BaseResponse {
    data: {
        roles: Role[];
    };
}

export interface CreateUserModel {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
    role_id: string[];
    team_id: string[];
}

export interface EditUserModel {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    roles?: string[];
    teams?: string[];
}
