export interface TagsModel {
  tags:
    {
      id: string;
      name: string;
    }[];
  total_count: number;
  total_pages: number;
  limit: number;
  page: number;
}
