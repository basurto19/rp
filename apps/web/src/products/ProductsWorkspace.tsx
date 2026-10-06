import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  createProductSchema,
  inventoryMovementSchema,
  updateProductSchema,
} from '@erp/validation';
import {
  apiDownload,
  apiErrorMessage,
  apiRequest,
  type Session,
} from '../api/client';

interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  unit: string;
  status: 'active' | 'inactive';
  updatedAt?: string;
}

interface ProductForm {
  name: string;
  description: string;
  sku: string;
  category: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minimumStock: string;
  unit: string;
  status: 'active' | 'inactive';
}

interface Movement {
  _id: string;
  type: 'entry' | 'exit';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  notes: string;
  createdAt?: string;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  sku: '',
  category: '',
  costPrice: '0',
  salePrice: '0',
  stock: '0',
  minimumStock: '0',
  unit: 'unidad',
  status: 'active',
};

function toPayload(form: ProductForm) {
  return {
    ...form,
    costPrice: Number(form.costPrice),
    salePrice: Number(form.salePrice),
    stock: Number(form.stock),
    minimumStock: Number(form.minimumStock),
  };
}

function currency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function ProductsWorkspace({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => Promise<void>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entry' | 'exit'>('entry');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      apiRequest<Product[]>(
        'GET',
        `/products?search=${encodeURIComponent(search)}`,
        undefined,
        session,
      )
        .then((data) => {
          if (current) setProducts(data);
        })
        .catch((reason: unknown) => {
          if (current) setError(apiErrorMessage(reason));
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 200);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [search, reloadKey, session]);

  const activeCount = useMemo(
    () => products.filter((product) => product.status === 'active').length,
    [products],
  );

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError('');
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku,
      category: product.category ?? '',
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minimumStock: String(product.minimumStock),
      unit: product.unit,
      status: product.status,
    });
    setIsFormOpen(true);
    setError('');
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = toPayload(form);
      const requestBody: Record<string, unknown> = { ...payload };
      if (editing) delete requestBody.stock;
      const validation = (editing ? updateProductSchema : createProductSchema).safeParse(requestBody);
      if (!validation.success) {
        throw new Error(validation.error.issues.map((issue) => issue.message).join(' '));
      }
      await apiRequest(
        editing ? 'PUT' : 'POST',
        editing ? `/products/${editing._id}` : '/products',
        validation.data,
        session,
      );
      setEditing(null);
      setIsFormOpen(false);
      setNotice(editing ? 'Producto actualizado.' : 'Producto creado.');
      setReloadKey((value) => value + 1);
    } catch (reason: unknown) {
      setError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product: Product) {
    setError('');
    setNotice('');
    try {
      const status = product.status === 'active' ? 'inactive' : 'active';
      await apiRequest('PATCH', `/products/${product._id}/status`, { status }, session);
      setNotice(status === 'active' ? 'Producto activado.' : 'Producto desactivado.');
      setReloadKey((value) => value + 1);
    } catch (reason: unknown) {
      setError(apiErrorMessage(reason));
    }
  }

  async function openInventory(product: Product) {
    setMovementProduct(product);
    setMovementQuantity('');
    setMovementNotes('');
    setError('');
    try {
      const history = await apiRequest<Movement[]>(
        'GET',
        `/products/${product._id}/inventory`,
        undefined,
        session,
      );
      setMovements(history);
    } catch (reason: unknown) {
      setMovements([]);
      setError(apiErrorMessage(reason));
    }
  }

  async function saveMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movementProduct) return;
    setSaving(true);
    setError('');
    try {
      const validation = inventoryMovementSchema.safeParse({
        type: movementType,
        quantity: Number(movementQuantity),
        notes: movementNotes,
      });
      if (!validation.success) {
        throw new Error(validation.error.issues.map((issue) => issue.message).join(' '));
      }
      await apiRequest(
        'POST',
        `/products/${movementProduct._id}/inventory`,
        validation.data,
        session,
      );
      setNotice('Movimiento de inventario registrado.');
      setMovementProduct(null);
      setReloadKey((value) => value + 1);
    } catch (reason: unknown) {
      setError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="products-app">
      <header className="products-topbar">
        <div>
          <span className="products-eyebrow">ERP · INVENTARIO</span>
          <h1>Productos</h1>
        </div>
        <div className="products-account">
          <span>{session.user.firstName} {session.user.lastName}</span>
          <button type="button" className="products-secondary-button" onClick={() => void onLogout()}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="products-content">
        <div className="products-heading">
          <div>
            <h2>Catálogo de productos</h2>
            <p>Administra los productos y existencias de tu empresa.</p>
          </div>
          <div className="products-row-actions">
            <button type="button" onClick={() => void apiDownload('/products/summary.pdf', session, 'resumen-productos.pdf').catch((reason: unknown) => setError(apiErrorMessage(reason)))}>
              Descargar resumen PDF
            </button>
            <button type="button" className="products-primary-button" onClick={startCreate}>
              Nuevo producto
            </button>
          </div>
        </div>

        <div className="products-summary">
          <div><strong>{products.length}</strong><span>Productos encontrados</span></div>
          <div><strong>{activeCount}</strong><span>Activos</span></div>
        </div>

        <label className="products-search-label" htmlFor="product-search">Buscar producto</label>
        <input
          id="product-search"
          className="products-search"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Nombre, SKU o categoría"
          autoComplete="off"
        />

        {notice ? <p className="products-notice" role="status">{notice}</p> : null}
        {error ? <p className="products-error" role="alert">{error}</p> : null}

        {loading ? <p className="products-empty" role="status">Cargando productos...</p> : null}
        {!loading && products.length === 0 ? (
          <p className="products-empty">No hay productos. Crea el primero para comenzar.</p>
        ) : null}

        {products.length > 0 ? (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Producto</th><th>SKU</th><th>Precio venta</th><th>Stock</th>
                  <th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span className="products-cell-secondary">{product.category || 'Sin categoría'}</span>
                    </td>
                    <td>{product.sku}</td>
                    <td>{currency(product.salePrice)}</td>
                    <td>
                      <strong>{product.stock} {product.unit}</strong>
                      {product.stock <= product.minimumStock ? (
                        <span className="products-low-stock">Stock bajo (mín. {product.minimumStock})</span>
                      ) : null}
                    </td>
                    <td><span className={`products-status ${product.status}`}>{product.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <div className="products-row-actions">
                        <button type="button" onClick={() => startEdit(product)}>Editar</button>
                        <button type="button" onClick={() => void openInventory(product)}>Inventario</button>
                        <button type="button" onClick={() => void toggleStatus(product)}>
                          {product.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {isFormOpen ? (
        <div className="products-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setEditing(null);
            setForm(emptyForm);
            setIsFormOpen(false);
          }
        }}>
          <section className="products-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="products-modal-heading">
              <h2 id="product-form-title">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button type="button" aria-label="Cerrar formulario" onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setIsFormOpen(false);
              }}>×</button>
            </div>
            <form onSubmit={(event) => void saveProduct(event)} className="products-form">
              <label>Nombre<input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} /></label>
              <label>SKU / Código<input required maxLength={100} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.currentTarget.value })} /></label>
              <label>Categoría<input maxLength={100} value={form.category} onChange={(event) => setForm({ ...form, category: event.currentTarget.value })} /></label>
              <label>Unidad<input required maxLength={40} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.currentTarget.value })} /></label>
              <label>Precio de costo<input required type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.currentTarget.value })} /></label>
              <label>Precio de venta<input required type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.currentTarget.value })} /></label>
              {!editing ? <label>Stock inicial<input required type="number" min="0" step="0.001" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.currentTarget.value })} /></label> : null}
              <label>Stock mínimo<input required type="number" min="0" step="0.001" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.currentTarget.value })} /></label>
              <label className="products-form-wide">Descripción<textarea maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.currentTarget.value })} /></label>
              <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.currentTarget.value as ProductForm['status'] })}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></label>
              {error ? <p className="products-error products-form-wide" role="alert">{error}</p> : null}
              <div className="products-form-actions products-form-wide">
                <button type="button" className="products-secondary-button" disabled={saving} onClick={() => {
                  setEditing(null);
                  setIsFormOpen(false);
                }}>Cancelar</button>
                <button type="submit" className="products-primary-button" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {movementProduct ? (
        <div className="products-modal-backdrop" role="presentation">
          <section className="products-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-title">
            <div className="products-modal-heading">
              <div><h2 id="inventory-title">Inventario</h2><p>{movementProduct.name} · Stock: {movementProduct.stock} {movementProduct.unit}</p></div>
              <button type="button" aria-label="Cerrar inventario" onClick={() => setMovementProduct(null)}>×</button>
            </div>
            <form onSubmit={(event) => void saveMovement(event)} className="products-form">
              <label>Movimiento<select value={movementType} onChange={(event) => setMovementType(event.currentTarget.value as 'entry' | 'exit')}><option value="entry">Entrada</option><option value="exit">Salida</option></select></label>
              <label>Cantidad<input required type="number" min="0.001" step="0.001" value={movementQuantity} onChange={(event) => setMovementQuantity(event.currentTarget.value)} /></label>
              <label className="products-form-wide">Nota<input maxLength={500} value={movementNotes} onChange={(event) => setMovementNotes(event.currentTarget.value)} /></label>
              {error ? <p className="products-error products-form-wide" role="alert">{error}</p> : null}
              <div className="products-form-actions products-form-wide">
                <button type="button" className="products-secondary-button" disabled={saving} onClick={() => setMovementProduct(null)}>Cancelar</button>
                <button type="submit" className="products-primary-button" disabled={saving || movementProduct.status !== 'active'}>{saving ? 'Guardando...' : 'Registrar movimiento'}</button>
              </div>
            </form>
            <h3>Movimientos recientes</h3>
            {movements.length === 0 ? <p className="products-empty">Sin movimientos registrados.</p> : (
              <ul className="products-movement-list">
                {movements.map((movement) => <li key={movement._id}><span>{movement.type === 'entry' ? 'Entrada' : 'Salida'}: {movement.quantity}</span><span>{movement.stockBefore} → {movement.stockAfter}</span><small>{movement.notes || 'Sin nota'}</small></li>)}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
