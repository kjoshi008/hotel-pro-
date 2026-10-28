import React, { useState, useEffect } from "react";
// --- Built-in SVG Icons ---
function IconCrown({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
function IconStar({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconCalendar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconCreditCard({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconUsers({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  );
}
// Connected Backend URL
const API_BASE = "http://localhost:8001/api";
const INITIAL_ROOMS = [
  {
    _id: "r101",
    roomNumber: "101",
    type: "Non-Delux",
    maxCount: 2,
    rentPerDay: 1800,
    avgRating: 4.8,
    photos: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"],
    description: "Queen suite with marble bath, ambient city skyline views, ergonomic work salon and ultra-fast Wi-Fi.",
  },
  {
    _id: "r102",
    roomNumber: "102",
    type: "Non-Delux",
    maxCount: 3,
    rentPerDay: 2600,
    avgRating: 4.9,
    photos: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"],
    description: "Dual queen layout featuring private dressing lounge, rainfall shower, and handcrafted hardwood accents.",
  },
  {
    _id: "r201",
    roomNumber: "201",
    type: "Delux",
    maxCount: 2,
    rentPerDay: 4200,
    avgRating: 5.0,
    photos: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"],
    description: "Opulent king deluxe suite with custom Egyptian cotton linens, panoramic terrace, freestanding tub, and sommelier bar.",
  },
  {
    _id: "r202",
    roomNumber: "202",
    type: "Delux",
    maxCount: 4,
    rentPerDay: 5800,
    avgRating: 4.9,
    photos: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"],
    description: "Grand master suite with two California king beds, private salon, bespoke marble foyer, and complimentary valet.",
  },
];
export default function App() {
  const [theme, setTheme] = useState("light");
  const [tab, setTab] = useState("suites"); // "suites" | "bookings" | "admin"
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [filterType, setFilterType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dates, setDates] = useState({ from: "", to: "" });
  const [bookingModal, setBookingModal] = useState(null);
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvv: "" });
  const [bookings, setBookings] = useState([
    {
      _id: "BK-9801",
      roomNumber: "201",
      type: "Delux",
      from: "2026-11-01",
      to: "2026-11-04",
      days: 3,
      total: 14112,
      status: "booked",
    },
  ]);
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Authentication: the backend determines the user's role after login.
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hotelpro_user") || "null"); }
    catch { return null; }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("hotelpro_token") || "");
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [selectedLoginRole, setSelectedLoginRole] = useState("Guest");
  const [bookingActionLoading, setBookingActionLoading] = useState("");

  const role = authUser?.userType === "Ordinary" ? "Guest" : authUser?.userType;
  const isAdmin = role === "Admin";
  const isStaff = role === "Staff";

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setAuthError("");
    setAuthModal(true);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/signup";
      // The role picker is a check against the role stored in MongoDB; it does not grant access.
      const payload = authMode === "login"
        ? { email: authForm.email.trim(), password: authForm.password }
        : { name: authForm.name.trim(), email: authForm.email.trim(), password: authForm.password, phone: authForm.phone, userType: "Ordinary" };
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || "Authentication failed. Please try again.");
      if (authMode === "signup") {
        setAuthMode("login");
        setAuthError("Account created successfully. Please log in.");
        setAuthForm((prev) => ({ ...prev, password: "" }));
        return;
      }
      const actualRole = data.user?.userType === "Ordinary" ? "Guest" : data.user?.userType;
      if (actualRole !== selectedLoginRole) {
        const roleLabel = actualRole || "unknown";
        throw new Error(`These credentials belong to the ${roleLabel} account, not ${selectedLoginRole}. Choose the correct role and try again.`);
      }
      localStorage.setItem("hotelpro_token", data.token);
      localStorage.setItem("hotelpro_user", JSON.stringify(data.user));
      setAuthToken(data.token);
      setAuthUser(data.user);
      setAuthModal(false);
      setAuthForm({ name: "", email: "", password: "", phone: "" });
      if (actualRole === "Staff") setTab("staff");
      else if (actualRole === "Admin") setTab("admin");
      else setTab("suites");
    } catch (err) {
      setAuthError(err.message || "Could not connect to the server. Make sure the backend is running.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("hotelpro_token");
    localStorage.removeItem("hotelpro_user");
    setAuthToken("");
    setAuthUser(null);
    setTab("suites");
    setAuthModal(false);
  };

  const openProtectedTab = (nextTab) => {
    if (!authUser || !authToken) {
      openAuth("login");
      return;
    }
    if (nextTab === "admin" && !isAdmin) {
      alert("The Executive Hub is available to Admin accounts only.");
      return;
    }
    if (nextTab === "staff" && !isStaff && !isAdmin) {
      alert("The Booking Desk is available to Staff accounts only.");
      return;
    }
    setTab(nextTab);
  };
  // Toggle dark/light theme
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-bs-theme", next);
  };
  // Connect to Backend API (with fallback if offline)
  useEffect(() => {
    fetch(`${API_BASE}/rooms`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.rooms?.length) setRooms(data.rooms);
      })
      .catch(() => {});
  }, []);

  const loadStaffBookings = async () => {
    try {
      const response = await fetch(`${API_BASE}/bookings/mine`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length) {
        const normalized = data.items.map((item) => ({
          ...item,
          from: item.from || item.fromDate || "—",
          to: item.to || item.toDate || "—",
          days: item.days || item.totalDays || 1,
          total: item.total ?? item.totalAmount ?? 0,
          status: item.status || "booked",
          guestName: item.guestName || "Guest",
          userEmail: item.userEmail || "",
        }));
        setBookings(normalized);
      }
    } catch (err) {
      console.error("Unable to load bookings:", err);
    }
  };

  useEffect(() => {
    if (authUser && (isStaff || isAdmin)) loadStaffBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authToken]);

  const updateBookingStatus = async (booking, nextStatus) => {
    const actionKey = `${booking._id}-${nextStatus}`;
    setBookingActionLoading(actionKey);
    try {
      // Persist database bookings. Demo-only BK- references are updated in this page's state.
      if (authToken && /^[a-f\d]{24}$/i.test(String(booking._id))) {
        const response = await fetch(`${API_BASE}/bookings/${booking._id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: nextStatus }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.msg || "Could not update booking status.");
      }
      setBookings((current) => current.map((item) => String(item._id) === String(booking._id) ? { ...item, status: nextStatus } : item));
    } catch (err) {
      alert(err.message || "Unable to update this booking.");
    } finally {
      setBookingActionLoading("");
    }
  };
  const filteredRooms = rooms.filter((r) => {
    if (filterType && r.type !== filterType) return false;
    if (maxPrice && r.rentPerDay > Number(maxPrice)) return false;
    return true;
  });
  // Confirm Reservation and save it to MongoDB when the backend is available.
  const confirmBooking = async (e) => {
    e.preventDefault();
    if (!card.name || !card.number) return alert("Please fill card details");
    if (!authUser || !authToken) {
      setBookingModal(null);
      openAuth("login");
      return;
    }
    const fromDate = dates.from || new Date().toISOString().slice(0, 10);
    const checkout = dates.to || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const days = Math.max(1, Math.ceil((new Date(checkout) - new Date(fromDate)) / 86400000));
    const total = Math.round(bookingModal.rentPerDay * days * 1.12);
    const bookingPayload = {
      roomNumber: bookingModal.roomNumber,
      type: bookingModal.type,
      guestName: authUser.name,
      userEmail: authUser.email,
      fromDate,
      toDate: checkout,
      totalDays: days,
      totalAmount: total,
      status: "booked",
    };
    let newBooking = {
      _id: "BK-" + Math.floor(1000 + Math.random() * 9000),
      roomNumber: bookingModal.roomNumber,
      type: bookingModal.type,
      from: fromDate,
      to: checkout,
      days,
      total,
      status: "booked",
      guestName: authUser.name,
      userEmail: authUser.email,
    };
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(bookingPayload),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.booking) {
        newBooking = { ...data.booking, from: data.booking.fromDate, to: data.booking.toDate, days: data.booking.totalDays, total: data.booking.totalAmount };
      } else if (!response.ok) {
        throw new Error(data.msg || "Booking could not be saved to the server.");
      }
    } catch (err) {
      console.error("Booking API unavailable; showing this reservation locally:", err);
    }
    setBookings((current) => [newBooking, ...current]);
    setBookingModal(null);
    setCard({ name: "", number: "", exp: "", cvv: "" });
    alert(`Suite #${bookingModal.roomNumber} reservation submitted.`);
    setTab(isStaff ? "staff" : "bookings");
  };
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg brand-nav no-print py-3">
        <div className="container">
          <div className="navbar-brand text-white d-flex align-items-center gap-2" style={{ cursor: "pointer" }} onClick={() => setTab("suites")}>
            <span className="p-2 rounded-3 text-warning d-inline-flex" style={{ background: "rgba(201,152,51,0.2)" }}>
              <IconCrown size={22} />
            </span>
            <div>
              <span className="font-serif fw-bold fs-4 tracking-wider d-block lh-1 text-white">HOTELPRO</span>
              <span className="small text-gold tracking-widest text-uppercase" style={{ fontSize: "0.65rem" }}>
                LUXURY COLLECTION
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className={`btn btn-sm ${tab === "suites" ? "btn-gold text-white" : "btn-outline-light"}`} onClick={() => setTab("suites")}>
              Explore Suites
            </button>
            {authUser && (
              <button className={`btn btn-sm ${tab === "bookings" ? "btn-gold text-white" : "btn-outline-light"}`} onClick={() => openProtectedTab("bookings")}>
                My Stays ({bookings.length})
              </button>
            )}
            {isAdmin && (
              <button className={`btn btn-sm ${tab === "admin" ? "btn-gold text-white" : "btn-outline-light"}`} onClick={() => openProtectedTab("admin")}>
                Executive Hub
              </button>
            )}
            {(isStaff || isAdmin) && (
              <button className={`btn btn-sm ${tab === "staff" ? "btn-gold text-white" : "btn-outline-light"}`} onClick={() => openProtectedTab("staff")}>
                Booking Desk
              </button>
            )}
            <button className="btn btn-sm btn-outline-light ms-2" onClick={toggleTheme}>
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
            {authUser ? (
              <div className="d-flex align-items-center gap-2 ms-1">
                <span className="small text-white d-none d-xl-inline">{authUser.name} · {role}</span>
                <button className="btn btn-sm btn-outline-light" onClick={logout}>Logout</button>
              </div>
            ) : (
              <button className="btn btn-sm btn-gold ms-1" onClick={() => openAuth("login")}>Login</button>
            )}
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      {tab === "suites" && (
        <header className="hero text-center position-relative">
          <div className="container position-relative" style={{ zIndex: 2 }}>
            <span className="badge bg-warning-subtle text-warning border border-warning px-3 py-1 rounded-pill small mb-3">
              ✦ EXQUISITE STAYS & PRIVATE RESIDENCES
            </span>
            <h1 className="font-serif display-4 fw-bold text-white mb-3" style={{ maxWidth: 860, margin: "0 auto" }}>
              Where Timeless Grandeur Meets Modern Comfort
            </h1>
            <p className="lead text-white-50 mx-auto mb-4" style={{ maxWidth: 640 }}>
              Discover handcrafted private residences, Michelin-star dining, and intuitive concierge services.
            </p>
            {/* Quick Search */}
            <div className="hero-search-card mx-auto text-start" style={{ maxWidth: 820 }}>
              <div className="row g-3 align-items-end text-body">
                <div className="col-md-4 col-sm-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-1">Check-In</label>
                  <input type="date" className="form-control" value={dates.from} onChange={(e) => setDates({ ...dates, from: e.target.value })} />
                </div>
                <div className="col-md-4 col-sm-6">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-1">Check-Out</label>
                  <input type="date" className="form-control" value={dates.to} onChange={(e) => setDates({ ...dates, to: e.target.value })} />
                </div>
                <div className="col-md-4 col-12">
                  <button className="btn btn-gold w-100 py-2" onClick={() => alert("Dates set. Explore available suites below!")}>
                    Check Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
      {/* Main Content */}
      <main className="container py-5 flex-grow-1">
        {/* SUITES DISCOVERY */}
        {tab === "suites" && (
          <>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h2 className="font-serif fw-bold mb-1">Curated Residences & Suites</h2>
                <p className="text-muted small mb-0">Showing {filteredRooms.length} luxury suites available.</p>
              </div>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">All Suite Classes</option>
                  <option value="Delux">Delux Suite</option>
                  <option value="Non-Delux">Non-Delux</option>
                </select>
                <select className="form-select form-select-sm" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                  <option value="">Any Budget</option>
                  <option value="3000">Under ₹3,000</option>
                  <option value="5000">Under ₹5,000</option>
                </select>
              </div>
            </div>
            <div className="row g-4">
              {filteredRooms.map((r) => (
                <div className="col-md-6 col-lg-3" key={r._id}>
                  <div className="card room-card h-100">
                    <div className="card-img-wrapper">
                      <img src={r.photos[0]} alt={`Suite ${r.roomNumber}`} />
                      <div className="price-pill">₹{r.rentPerDay} <small style={{ fontSize: "0.7rem", opacity: 0.7 }}>/ night</small></div>
                    </div>
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="font-serif fw-bold mb-0">Suite {r.roomNumber}</h5>
                        <span className={`badge ${r.type === "Delux" ? "bg-warning text-dark" : "bg-secondary"}`}>{r.type}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-warning small mb-2">
                        <IconStar />
                        <span className="fw-bold">{r.avgRating}</span>
                        <span className="text-muted ms-auto small d-flex align-items-center gap-1">
                          <IconUsers /> Up to {r.maxCount}
                        </span>
                      </div>
                      <p className="small text-muted flex-grow-1">{r.description}</p>
                      <button className="btn btn-gold btn-sm w-100 mt-2" onClick={() => authUser ? setBookingModal(r) : openAuth("login")}>
                        Reserve This Suite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* BOOKINGS & INVOICES */}
        {tab === "bookings" && (
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <h2 className="font-serif fw-bold mb-1">My Hotel Reservations</h2>
            <p className="text-muted small mb-4">View digital folios and printable tax invoices.</p>
            <div className="d-flex flex-column gap-3">
              {bookings.map((b) => (
                <div key={b._id} className="card shadow-sm p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="font-serif fw-bold mb-0">{b.type} Suite #{b.roomNumber}</h5>
                      <span className="small text-muted font-monospace">REF: {b._id}</span>
                    </div>
                    <span className={`badge ${(b.status === "cancelled") ? "bg-danger" : (b.status === "confirmed") ? "bg-success" : "bg-warning text-dark"}`}>{b.status === "booked" ? "Pending confirmation" : String(b.status || "booked").replaceAll("_", " ").toUpperCase()}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 my-2" style={{ background: "var(--hp-surface-subtle)" }}>
                    <div className="small">
                      <IconCalendar size={14} /> Stay: <strong>{b.from}</strong> to <strong>{b.to}</strong> ({b.days} Nights)
                    </div>
                    <div className="fs-5 fw-bold font-serif text-gold">₹{b.total}</div>
                  </div>
                  <div className="d-flex gap-2 justify-content-end mt-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveInvoice(b)}>
                      View Printable Folio / Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* STAFF BOOKING DESK */}
        {tab === "staff" && (isStaff || isAdmin) && (
          <div>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h2 className="font-serif fw-bold mb-1">Staff Booking Desk</h2>
                <p className="text-muted small mb-0">Review reservations and confirm or cancel booking requests.</p>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={loadStaffBookings}>Refresh Bookings</button>
            </div>
            {bookings.length === 0 ? (
              <div className="card p-4 text-center text-muted">No bookings are available yet.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {bookings.map((b) => {
                  const status = String(b.status || "booked").toLowerCase();
                  const isPending = status === "booked" || status === "pending";
                  return (
                    <div key={b._id} className="card shadow-sm p-4">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                          <h5 className="font-serif fw-bold mb-1">{b.type} Suite #{b.roomNumber}</h5>
                          <div className="small text-muted">Reference: {b._id}</div>
                          <div className="small mt-2">Guest: <strong>{b.guestName || "Guest"}</strong> {b.userEmail ? `· ${b.userEmail}` : ""}</div>
                        </div>
                        <span className={`badge ${status === "cancelled" ? "bg-danger" : status === "confirmed" ? "bg-success" : "bg-warning text-dark"}`}>
                          {status === "booked" ? "Pending confirmation" : status.replaceAll("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 rounded-3 my-3" style={{ background: "var(--hp-surface-subtle)" }}>
                        <div className="small"><IconCalendar size={14} /> Stay: <strong>{b.from || b.fromDate || "—"}</strong> to <strong>{b.to || b.toDate || "—"}</strong> ({b.days || b.totalDays || 1} nights)</div>
                        <div className="fs-5 fw-bold font-serif text-gold">₹{b.total ?? b.totalAmount ?? 0}</div>
                      </div>
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        <button className="btn btn-success btn-sm" disabled={!isPending || bookingActionLoading === `${b._id}-confirmed`} onClick={() => updateBookingStatus(b, "confirmed")}>
                          {bookingActionLoading === `${b._id}-confirmed` ? "Saving..." : "Confirm Booking"}
                        </button>
                        <button className="btn btn-outline-danger btn-sm" disabled={status === "cancelled" || bookingActionLoading === `${b._id}-cancelled`} onClick={() => updateBookingStatus(b, "cancelled")}>
                          {bookingActionLoading === `${b._id}-cancelled` ? "Saving..." : "Cancel Booking"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* EXECUTIVE OPS */}
        {tab === "admin" && isAdmin && (
          <div>
            <h2 className="font-serif fw-bold mb-1">Executive Operations Hub</h2>
            <p className="text-muted small mb-4">Real-time revenue metrics and occupancy telemetry.</p>
            <div className="row g-3">
              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-top border-warning border-3">
                  <span className="small text-muted text-uppercase fw-bold">Net Revenue</span>
                  <div className="fs-3 fw-bold font-serif text-gold">₹1,84,500</div>
                  <span className="small text-success">↑ 14% vs last week</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-top border-success border-3">
                  <span className="small text-muted text-uppercase fw-bold">Occupancy Rate</span>
                  <div className="fs-3 fw-bold font-serif">78%</div>
                  <span className="small text-muted">18 of 24 suites filled</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-top border-primary border-3">
                  <span className="small text-muted text-uppercase fw-bold">Active Bookings</span>
                  <div className="fs-3 fw-bold font-serif">{bookings.length + 12}</div>
                  <span className="small text-muted">4 Arrivals today</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-top border-info border-3">
                  <span className="small text-muted text-uppercase fw-bold">MERN Health</span>
                  <div className="fs-3 fw-bold font-serif text-success">100%</div>
                  <span className="small text-muted">Node/Express/Mongo Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Login / Sign-up Modal */}
      {authModal && (
        <div className="modal-backdrop-luxury" onClick={() => setAuthModal(false)}>
          <div className="modal-content-luxury p-4 p-md-5 shadow-lg" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <div className="text-gold small fw-bold text-uppercase mb-2">HotelPro Luxury Collection</div>
                <h3 className="font-serif fw-bold mb-1">{authMode === "login" ? "Welcome Back" : "Create Your Account"}</h3>
                <p className="text-muted small mb-0">{authMode === "login" ? "Sign in to manage your hotel stays." : "Register as a guest to reserve a suite."}</p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setAuthModal(false)} />
            </div>
            {authError && (
              <div className={`alert ${authError.toLowerCase().includes("successfully") ? "alert-success" : "alert-danger"} py-2 small`} role="alert">
                {authError}
              </div>
            )}
            <form onSubmit={handleAuth}>
              {authMode === "signup" && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full name</label>
                    <input className="form-control" required autoComplete="name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Enter your full name" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone (optional)</label>
                    <input className="form-control" autoComplete="tel" value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="Enter phone number" />
                  </div>
                </>
              )}
              {authMode === "login" && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Login as</label>
                  <select className="form-select" value={selectedLoginRole} onChange={(e) => { setSelectedLoginRole(e.target.value); setAuthError(""); }}>
                    <option value="Guest">Guest</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <div className="form-text">Choose the role assigned to your account. Your database role must match.</div>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email address</label>
                <input className="form-control" type="email" required autoComplete="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Password</label>
                <input className="form-control" type="password" required minLength={6} autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Enter your password" />
              </div>
              <button className="btn btn-gold w-100 py-2 mt-2" type="submit" disabled={authLoading}>
                {authLoading ? "Please wait..." : authMode === "login" ? "Login to HotelPro" : "Create Guest Account"}
              </button>
            </form>
            <div className="text-center small mt-4">
              {authMode === "login" ? (
                <>Don't have an account? <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Sign up</button></>
              ) : (
                <>Already registered? <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => { setAuthMode("login"); setAuthError(""); }}>Log in</button></>
              )}
            </div>
            <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "0.75rem" }}>
              Choosing a role does not grant permissions; the selected role must match the account stored in the database. New sign-ups are Guest accounts.
            </p>
          </div>
        </div>
      )}

      {/* Credit Card Modal */}
      {bookingModal && (
        <div className="modal-backdrop-luxury" onClick={() => setBookingModal(null)}>
          <div className="modal-content-luxury p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-serif fw-bold mb-0">Reserve Suite {bookingModal.roomNumber}</h5>
              <button className="btn-close" onClick={() => setBookingModal(null)} />
            </div>
            <div className="luxury-card-preview">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="card-chip" />
                <IconCreditCard size={24} />
              </div>
              <div className="fs-5 tracking-widest font-monospace mb-3">
                {card.number.padEnd(16, "•").match(/.{1,4}/g)?.join(" ") || "•••• •••• •••• ••••"}
              </div>
              <div className="d-flex justify-content-between small text-uppercase">
                <span>{card.name || "GUEST NAME"}</span>
                <span>{card.exp || "MM/YY"}</span>
              </div>
            </div>
            <form onSubmit={confirmBooking}>
              <div className="mb-2">
                <label className="form-label small fw-bold">Cardholder Name</label>
                <input className="form-control" placeholder="Eleanor Vance" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-bold">Card Number</label>
                <input className="form-control" placeholder="4242 0000 1234 5678" maxLength={16} value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Expiry</label>
                  <input className="form-control" placeholder="12/28" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">CVV</label>
                  <input className="form-control" type="password" placeholder="•••" maxLength={3} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-gold w-100 py-2">
                Authorize & Confirm (₹{bookingModal.rentPerDay * 2 * 1.12})
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Printable Folio Modal */}
      {activeInvoice && (
        <div className="modal-backdrop-luxury" onClick={() => setActiveInvoice(null)}>
          <div className="invoice-sheet p-4 p-md-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start mb-4 border-bottom pb-3">
              <div>
                <h3 className="font-serif fw-bold mb-0">HOTELPRO GRAND</h3>
                <span className="small text-gold text-uppercase tracking-wider">Official Guest Folio</span>
              </div>
              <div className="text-end">
                <span className="badge bg-dark text-warning font-monospace">{activeInvoice._id}</span>
                <div className="small text-muted">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="row mb-3 small">
              <div className="col-6">
                <strong>Stay:</strong><br />
                Suite #{activeInvoice.roomNumber} ({activeInvoice.type})<br />
                {activeInvoice.from} to {activeInvoice.to} ({activeInvoice.days} Nights)
              </div>
              <div className="col-6 text-end">
                <strong>Folio Status:</strong><br />
                <span className="text-success fw-bold">Paid & Confirmed</span>
              </div>
            </div>
            <table className="table small my-3">
              <thead><tr><th>Description</th><th className="text-end">Amount</th></tr></thead>
              <tbody>
                <tr><td>{activeInvoice.days} Nights Suite Accommodation</td><td className="text-end">₹{activeInvoice.total - Math.round(activeInvoice.total * 0.12)}</td></tr>
                <tr><td>Hospitality Tax (12%)</td><td className="text-end">₹{Math.round(activeInvoice.total * 0.12)}</td></tr>
                <tr className="fw-bold fs-6"><td>Net Folio Total</td><td className="text-end text-gold">₹{activeInvoice.total}</td></tr>
              </tbody>
            </table>
            <div className="d-flex gap-2 justify-content-end no-print mt-4">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveInvoice(null)}>Close</button>
              <button className="btn btn-gold btn-sm" onClick={() => window.print()}>Print / Save as PDF</button>
            </div>
          </div>
        </div>
      )}
      <footer className="py-4 text-center small text-muted border-top mt-auto no-print">
        © {new Date().getFullYear()} HotelPro Luxury Collection. Full MERN Stack.
      </footer>
    </div>
  );
}
