export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  is_base_admin: boolean;
  client_id: string;
  roles: string[];
}


export interface EditUserModel {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string[];
  team: string[];

}

export function toJson(user: EditUserModel): string {
  return JSON.stringify(user, null, 2);
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

export function toJsonCreate(user: CreateUserModel): string {
  return JSON.stringify(user, null, 2);
}
