export const CUSTOMERS_PATTERNS = {
  FIND_ALL: 'customers.findAll',
  FIND_BY_ID: 'customers.findById',
  CREATE: 'customers.create',
  UPDATE: 'customers.update',
  DELETE: 'customers.delete',
} as const;

export interface CreateCustomerCommand {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  parentId?: string;
}

export interface UpdateCustomerCommand {
  id: string;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    parentId?: string;
  };
}

export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  parentId?: string;
  subCustomers?: CustomerDto[];
  createdAt: string;
  updatedAt: string;
}
