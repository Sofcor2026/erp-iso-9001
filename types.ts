export type Permission =
  // Platform
  'platform:access' |
  'platform:manage_tenants' |
  'platform:manage_plans' |
  'platform:manage_roles' |
  'platform:view_audit_log' |

  // Tenant
  'tenant:admin' |
  'tenant:view_master_list' |
  'tenant:manage_users' |

  // Documents
  'document:create' |
  'document:update' | // Can edit any document from master list
  'document:publish' | // Can approve, set to 'Vigente', or 'Obsoleto'
  'document:submit' | // Can send 'Borrador' to 'En Revisión'
  'document:download' |
  'document:view_all' | // Can see drafts, etc.
  'document:view_published' | // Can only see 'Vigente'

  // KPIs
  'kpi:manage' |
  'kpi:read' |

  // Forms
  'form:create';


export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  tenantId?: string;
  activo: boolean;
}

export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  userLimit: number;
  storageLimit: number; // in GB
  descripcion: string;
}

export interface Tenant {
  id: string;
  nombre: string;
  subdominio: string;
  planId: string; // Changed from Plan (string) to planId
  planNombre: string;
  estado: 'Activo' | 'Suspendido' | 'Prueba';
  fechaCreacion: string;
  userCount: number;
  storageUsed: number; // in GB
  userLimit: number;
  storageLimit: number; // in GB
}

export enum ProcessType {
  ESTRATEGICO = 'Estratégico',
  MISIONAL = 'Misional',
  APOYO = 'Apoyo',
  CONTROL = 'Control-Calidad',
}

export enum DocumentType {
  MANUAL = 'Manual',
  PROCEDIMIENTO = 'Procedimiento',
  FORMATO = 'Formato',
  POLITICA = 'Política',
  ACTA = 'Acta',
}

export enum DocumentStatus {
  BORRADOR = 'Borrador',
  REVISION = 'En Revisión',
  APROBADO = 'Aprobado',
  VIGENTE = 'Vigente',
  OBSOLETO = 'Obsoleto',
}

export interface DocumentoHistorial {
  id: string;
  fecha: string;
  autor: string;
  version: number;
  cambios: string;
}

export interface Document {
  id: string;
  codigo: string;
  nombre: string;
  proceso: ProcessType;
  subproceso?: string;
  tipo: DocumentType;
  version: number;
  estado: DocumentStatus;
  responsableId: string;
  responsableNombre: string;
  fechaEmision: string;
  fechaRevision: string;
  archivoUrl: string;
  fileSize?: number; // en GB
  contentType?: 'file' | 'spreadsheet';
  vinculos?: {
    kpiIds?: string[];
    formId?: string;
    formType?: 'Cotizacion' | 'OrdenCompra' | 'Dotacion';
  };
  historial?: DocumentoHistorial[];
}

export interface EquipmentAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeNombre?: string;
  itemNombre: string;
  cantidad: number;
  talla?: string;
  estado: 'Pendiente' | 'Entregado' | 'Devuelto';
  fechaEntrega: string;
  recibidoPor?: string;
  notas?: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  numero: string;
  clienteId: string;
  clienteNombre?: string;
  monto: number;
  estado: 'Pendiente' | 'Enviada' | 'Aprobada' | 'Rechazada';
  vendedorId: string;
  vendedorNombre?: string;
  items: any[];
  fechaEmision: string;
  fechaVencimiento?: string;
}

export interface KPI {
  id: string;
  nombre: string;
  unidad: string;
  meta: number;
  periodicidad: 'Diario' | 'Semanal' | 'Mensual' | 'Anual';
  proceso: ProcessType;
  subproceso?: string;
  responsableId: string;
  responsableNombre: string;
}

export interface Contacto {
  id: string;
  tipo: 'CLIENTE' | 'PROVEEDOR';
  rut_nit: string;
  razonSocial: string;
  email: string;
}

export interface OrdenCompraItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompra {
  id: string;
  numero: string;
  proveedorId: string;
  fecha: string;
  items: OrdenCompraItem[];
  subtotal: number;
  impuestos: number;
  total: number;
  condiciones: string;
  centroCosto: string;
  documentoId_link?: string;
}

export type TemplateType = 'COTIZACION' | 'ORDEN_COMPRA' | 'DOTACION';

export interface Template {
  id: string;
  nombre: string;
  tipo: TemplateType;
  version: number;
  lastUpdated: string;
  fileUrl: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
}