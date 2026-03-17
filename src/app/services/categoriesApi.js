import { request } from './apiClient';

export function getCategoriesApi() {
  return request('/api/Categories', {
    method: 'GET',
  });
}
