import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

/* =========================
   Lightweight shared styles
   ========================= */
const css = `
:root{--accent:#2f6feb;--danger:#e25555;--muted:#666}
*{box-sizing:border-box}
body{font-family:Inter,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial; margin:0; background:#f6f7fb;}
.app-shell{display:flex; min-height:100vh}
.sidebar{width:260px;padding:18px;background:#fff;border-right:1px solid #eee}
.sidebar h3{margin:0 0 12px 0}
.sidebar a{display:block;color:var(--accent);text-decoration:none;margin:8px 0}
.header{display:flex;justify-content:space-between;align-items:center;padding:18px;background:#fff;border-bottom:1px solid #eee}
.container{flex:1;padding:18px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:18px}
.card{background:#fff;padding:14px;border-radius:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
.product-img{width:120px;height:120px;object-fit:contain;margin:8px auto}
.filters{width:240px;background:#fff;padding:16px;border-right:1px solid #eee}
.layout{display:flex;gap:16px}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px}
.input{padding:8px;border-radius:8px;border:1px solid #ddd}
.btn{padding:8px 12px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer}
.btn-sm{padding:6px 10px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer}
.btn-danger{background:var(--danger)}
.filter-list{display:flex;flex-direction:column;gap:8px;max-height:300px;overflow:auto}
.pagination{display:flex;gap:8px;align-items:center;margin-top:16px}
.table{width:100%;border-collapse:collapse;margin-top:12px}
.th, .td{padding:8px 10px;border-bottom:1px solid #f3f3f3;text-align:left}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;justify-content:center;align-items:center;z-index:40}
.modal{width:720px;background:#fff;padding:18px;border-radius:10px}
.small{font-size:13px;color:var(--muted)}
.badge{display:inline-block;background:#eef4ff;color:var(--accent);padding:6px 8px;border-radius:999px;font-size:13px}
`;

/* =========================
   Fake auth helper (demo)
   ========================= */
const auth = {
  login(email, password) {
    if (email === "admin@gmail.com" && password === "admin123") {
      localStorage.setItem("admin_token", "ok");
      return true;
    }
    return false;
  },
  logout() {
    localStorage.removeItem("admin_token");
  },
  isAuthenticated() {
    return !!localStorage.getItem("admin_token");
  },
};

/* =========================
   Protected route HOC
   ========================= */
function AdminRoute({ children }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

/* =========================
   ECOMMERCE: Home page components
   ========================= */
function Home({ products, onFetchMore, filters, setFilters }) {
  const [search, setSearch] = useState("");
  const [pageLocal, setPageLocal] = useState(1);
  const limit = 12;

  // categories & brands lists (derived)
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).slice(0, 20),
    [products]
  );
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).slice(0, 50), [products]);

  // apply filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.title.toLowerCase().includes(q))
      .filter((p) => (filters.categories.length === 0 ? true : filters.categories.includes(p.category)))
      .filter((p) => (filters.brands.length === 0 ? true : filters.brands.includes(p.brand)));
  }, [products, search, filters]);

  // page chunk
  const start = (pageLocal - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));

  // toggle category & brand helpers
  function toggleCat(cat) {
    setFilters((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat],
      };
    });
  }
  function toggleBrand(b) {
    setFilters((prev) => {
      const exists = prev.brands.includes(b);
      return {
        ...prev,
        brands: exists ? prev.brands.filter((x) => x !== b) : [...prev.brands, b],
      };
    });
  }

  return (
    <div>
      <div className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Store</h2>
          <div className="small">({products.length} products loaded)</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input className="input" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn" onClick={() => { setSearch(""); setPageLocal(1); }}>Clear</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
        <div className="filters">
          <h4>Categories <span className="small">({filters.categories.length} selected)</span></h4>
          <div className="filter-list">
            {categories.map((c) => (
              <label key={c} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={filters.categories.includes(c)} onChange={() => toggleCat(c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>

          <h4 style={{ marginTop: 12 }}>Brands <span className="small">({filters.brands.length} selected)</span></h4>
          <div className="filter-list">
            {brands.slice(0, 20).map((b) => (
              <label key={b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={filters.brands.includes(b)} onChange={() => toggleBrand(b)} />
                <span>{b}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => { setFilters({ categories: [], brands: [] }); }}>Reset Filters</button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="small">Showing {pageItems.length} of {filtered.length} result(s)</div>
            <div>
              <button className="btn-sm" onClick={() => onFetchMore()}>Load more from API</button>
            </div>
          </div>

          <div className="grid">
            {pageItems.map((p) => (
              <div className="card" key={p.id}>
                <img className="product-img" src={p.thumbnail} alt={p.title} />
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div className="small">{p.brand}</div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>₹{p.price}</div>
                <div style={{ marginTop: 10 }}>
                  {p.stock > 0 ? <button className="btn-sm">Add to cart</button> : <button className="btn-sm btn-danger">Out of stock</button>}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button className="btn-sm" onClick={() => setPageLocal((s) => Math.max(1, s - 1))} disabled={pageLocal === 1}>Prev</button>
            <div className="small">Page {pageLocal} / {totalPages}</div>
            <button className="btn-sm" onClick={() => setPageLocal((s) => Math.min(totalPages, s + 1))} disabled={pageLocal === totalPages}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   ADMIN: Login + Dashboard + Products editor
   ========================= */
function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const ok = auth.login(email.trim(), password);
    if (ok) navigate("/admin/dashboard");
    else setErr("Invalid credentials");
  }

  return (
    <div style={{ padding: 30 }}>
      <div style={{ maxWidth: 520, margin: "24px auto", background: "#fff", padding: 18, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          <div style={{ color: "red", minHeight: 18 }}>{err}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit">Login</button>
            <button type="button" className="btn" onClick={() => { setEmail("admin@gmail.com"); setPassword("admin123"); setErr(""); }}>Fill demo</button>
          </div>
          <div className="small">Demo creds: admin@gmail.com / admin123</div>
        </form>
      </div>
    </div>
  );
}

function AdminShell({ products, setProducts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // dashboard stats
  const total = products.length;
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).length, [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).length, [products]);

  // products page handlers
  function handleDelete(id) {
    if (!window.confirm("Delete product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }
  function handleAdd() { setEditing(null); setShowModal(true); }
  function handleEdit(p) { setEditing(p); setShowModal(true); }
  function handleSave(form) {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p)));
    } else {
      const id = Math.max(0, ...products.map((p) => p.id)) + 1;
      setProducts((prev) => [{ id, ...form }, ...prev]);
    }
    setShowModal(false);
  }

  return (
    <div className="app-shell">
      <div className="sidebar">
        <h3>Admin Panel</h3>
        <Link to="/admin/dashboard">Dashboard</Link>
        <Link to="/admin/products">Products</Link>
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-danger" onClick={() => { auth.logout(); navigate("/admin/login"); }}>Logout</button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="header">
          <h3 style={{ margin: 0 }}>Store Admin</h3>
          <div className="small">{location.pathname}</div>
        </div>

        <div style={{ padding: 18 }}>
          <Routes>
            <Route path="dashboard" element={
              <div>
                <h2>Dashboard</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="card" style={{ width: 160 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{total}</div>
                    <div className="small">Products</div>
                  </div>
                  <div className="card" style={{ width: 160 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{categories}</div>
                    <div className="small">Categories</div>
                  </div>
                  <div className="card" style={{ width: 160 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{brands}</div>
                    <div className="small">Brands</div>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <h4>Recent products</h4>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {products.slice(0, 6).map((p) => (
                      <div key={p.id} className="card" style={{ width: 220 }}>
                        <img src={p.thumbnail} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }} />
                        <div style={{ fontWeight: 600, marginTop: 8 }}>{p.title}</div>
                        <div className="small">{p.brand} • {p.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            } />

            <Route path="products" element={
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2>Products</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={handleAdd}>Add Product</button>
                    <button className="btn" onClick={() => { /* export quick JSON */ const blob = new Blob([JSON.stringify(products, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'products.json'; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button>
                  </div>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th className="th">ID</th>
                      <th className="th">Product</th>
                      <th className="th">Brand</th>
                      <th className="th">Category</th>
                      <th className="th">Price</th>
                      <th className="th">Stock</th>
                      <th className="th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="td">{p.id}</td>
                        <td className="td">
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <img src={p.thumbnail} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                            <div>
                              <div style={{ fontWeight: 700 }}>{p.title}</div>
                              <div className="small">{p.description?.slice(0, 60)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td">{p.brand}</td>
                        <td className="td">{p.category}</td>
                        <td className="td">₹{p.price}</td>
                        <td className="td">{p.stock}</td>
                        <td className="td">
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn" onClick={() => handleEdit(p)}>Edit</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 16 }} className="small">Total: {products.length}</div>
              </div>
            }/>
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{editing ? "Edit Product" : "Add Product"}</h3>
            <ProductEditor initial={editing || null} onCancel={() => setShowModal(false)} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Product editor (used by admin)
   ========================= */
function ProductEditor({ initial = null, onCancel, onSave }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    price: initial?.price || 0,
    brand: initial?.brand || "",
    category: initial?.category || "",
    thumbnail: initial?.thumbnail || "",
    stock: initial?.stock ?? 0,
  });

  function update(field, value) {
    setForm((s) => ({ ...s, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title required");
    onSave(form);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <input className="input" placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} />
      <input className="input" placeholder="Brand" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
      <input className="input" placeholder="Category" value={form.category} onChange={(e) => update("category", e.target.value)} />
      <input className="input" placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e) => update("thumbnail", e.target.value)} />
      <input className="input" placeholder="Price" type="number" value={form.price} onChange={(e) => update("price", Number(e.target.value))} />
      <input className="input" placeholder="Stock" type="number" value={form.stock} onChange={(e) => update("stock", Number(e.target.value))} />
      <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" type="submit">Save</button>
        <button className="btn" type="button" onClick={onCancel} style={{ background: "#888" }}>Cancel</button>
      </div>
    </form>
  );
}

/* =========================
   Top-level App (router + data fetch)
   ========================= */
export default function AppRoot() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);

  // initial load (fetch first 30)
  useEffect(() => {
    setLoading(true);
    axios.get("https://dummyjson.com/products?limit=30")
      .then((res) => {
        const items = res.data?.products || [];
        setProducts(items.map((p) => ({ ...p })));
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // helper: fetch more products (load next 30)
  function fetchMoreFromAPI() {
    const skip = products.length;
    axios
      .get(`https://dummyjson.com/products?limit=30&skip=${skip}`)
      .then((res) => {
        const items = res.data?.products || [];
        // append unique ones
        setProducts((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          const toAdd = items.filter((p) => !existing.has(p.id));
          return [...prev, ...toAdd];
        });
      })
      .catch(console.error);
  }

    return (
    <BrowserRouter>
      <style>{css}</style>

      <Routes>
        {/* Public e-commerce site */}
        <Route
          path="/"
          element={
            loading ? (
              <div style={{ padding: 40 }}>Loading products...</div>
            ) : (
              <Home
                products={products}
                onFetchMore={fetchMoreFromAPI}
                filters={filters}
                setFilters={setFilters}
              />
            )
          }
        />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminShell products={products} setProducts={setProducts} />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
