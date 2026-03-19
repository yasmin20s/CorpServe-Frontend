import { request } from './apiClient';

export function getCategoriesApi() {
  return request('/api/Categories', {
    method: 'GET',
  });
}

export function getAdminCategoriesApi({ token, search = '', pageIndex = 1, pageSize = 6 }) {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  return request(`/api/Categories/admin?${query.toString()}`, {
    method: 'GET',
    token,
  });
}

export function createCategoryApi({ categoryName, description, token }) {
  return request('/api/Categories/admin/Create-Category', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      categoryName,
      description,
    }),
  });
}

export function updateCategoryApi({ categoryId, categoryName, description, token }) {
  return request(`/api/Categories/admin/Update-Category/${categoryId}`, {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      categoryName,
      description,
    }),
  });
}

export function deleteCategoryApi({ categoryId, token }) {
  return request(`/api/Categories/admin/Delete-Category/${categoryId}`, {
    method: 'DELETE',
    token,
  });
}
