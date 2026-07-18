// Travel with Kids Hub - Main Application
let tripsData = null;
let currentTrip = null;
let map = null;

// Load data
async function init() {
    try {
        const response = await fetch('trips.json');
        tripsData = await response.json();
        renderFamilyInfo();
        renderPackingList();
        setupPackingModal();
        renderTripsGrid();
        setupFilters();
        setupNavigation();
    } catch (error) {
        console.error('Failed to load trips data:', error);
        document.getElementById('tripsGrid').innerHTML = `
            <div class="no-trips">
                <h3>Could not load trips data</h3>
                <p>Make sure trips.json is in the same folder as index.html</p>
            </div>`;
    }
}

// Calculate age in years and months from birthDate to a given date
function calcAge(birthDateStr, atDate) {
    const birth = new Date(birthDateStr);
    const at = new Date(atDate);
    let years = at.getFullYear() - birth.getFullYear();
    let months = at.getMonth() - birth.getMonth();
    if (at.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    return { years, months };
}

function formatAge(age) {
    if (age.years === 0) return `${age.months} חודשים`;
    if (age.months === 0) return `${age.years}`;
    return `${age.years}.${age.months}`;
}

// Render family info in header
function renderFamilyInfo() {
    const container = document.getElementById('familyInfo');
    const today = new Date().toISOString().split('T')[0];
    container.innerHTML = tripsData.family.kids.map(kid => {
        const age = calcAge(kid.birthDate, today);
        const icon = kid.gender === 'boy' ? '👦' : '👧';
        return `<span class="kid-badge">${icon} ${kid.name} (${formatAge(age)})</span>`;
    }).join('');
}

// Calculate kids' ages at time of trip (exclude kids not yet born)
function getKidsAgesAtTrip(trip) {
    const tripStart = trip.dates.start;
    return tripsData.family.kids
        .map(kid => {
            const age = calcAge(kid.birthDate, tripStart);
            return { name: kid.name, age, gender: kid.gender };
        })
        .filter(kid => kid.age.years >= 0);
}

// Format date range
function formatDateRange(dates) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const options = { month: 'short', day: 'numeric' };
    const yearOpts = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', yearOpts)}`;
}

// Calculate trip duration
function getTripDuration(dates) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} days`;
}

// Check if trip is in the past or future
function getTripStatus(trip) {
    const endDate = new Date(trip.dates.end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today ? 'past' : 'future';
}

// Render the general packing list into the modal grid
function renderPackingList() {
    const grid = document.getElementById('packingGrid');
    if (!grid) return;
    const list = tripsData.packingList;
    if (!list || list.length === 0) {
        grid.innerHTML = '<p>אין רשימת ציוד עדיין.</p>';
        return;
    }

    const checked = loadPackingState();
    grid.innerHTML = list.map(cat => `
        <div class="packing-category">
            <h3>${cat.icon || '📦'} ${cat.category}</h3>
            <ul class="packing-items">
                ${cat.items.map(item => {
                    const key = `${cat.category}::${item}`;
                    const isChecked = checked[key] ? 'checked' : '';
                    return `<li>
                        <label class="packing-item ${isChecked ? 'is-checked' : ''}">
                            <input type="checkbox" data-key="${encodeURIComponent(key)}" ${isChecked}>
                            <span>${item}</span>
                        </label>
                    </li>`;
                }).join('')}
            </ul>
        </div>`).join('');

    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const key = decodeURIComponent(cb.dataset.key);
            const state = loadPackingState();
            if (cb.checked) state[key] = true; else delete state[key];
            savePackingState(state);
            cb.closest('.packing-item').classList.toggle('is-checked', cb.checked);
        });
    });
}

const PACKING_STORAGE_KEY = 'twk-packing-checked';

function loadPackingState() {
    try {
        return JSON.parse(localStorage.getItem(PACKING_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function savePackingState(state) {
    try {
        localStorage.setItem(PACKING_STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore storage errors */ }
}

// Setup packing list modal open/close
function setupPackingModal() {
    const modal = document.getElementById('packingModal');
    const openBtn = document.getElementById('packingBtn');
    const closeBtn = document.getElementById('packingClose');
    const backdrop = document.getElementById('packingBackdrop');
    if (!modal || !openBtn) return;

    const open = () => { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
    const close = () => { modal.classList.add('hidden'); document.body.style.overflow = ''; };

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
    });
}

// Render trip cards grid
function renderTripsGrid(filter = 'all') {
    const grid = document.getElementById('tripsGrid');
    let trips = tripsData.trips;
    
    if (filter === 'past') {
        trips = trips.filter(t => getTripStatus(t) === 'past');
    } else if (filter === 'future') {
        trips = trips.filter(t => getTripStatus(t) === 'future');
    } else if (filter !== 'all') {
        trips = trips.filter(t => t.region === filter);
    }

    // Sort: future trips first (by start date), then past trips (most recent first)
    trips.sort((a, b) => {
        const statusA = getTripStatus(a);
        const statusB = getTripStatus(b);
        if (statusA !== statusB) return statusA === 'future' ? -1 : 1;
        if (statusA === 'future') return new Date(a.dates.start) - new Date(b.dates.start);
        return new Date(b.dates.start) - new Date(a.dates.start);
    });

    if (trips.length === 0) {
        grid.innerHTML = `<div class="no-trips"><h3>אין טיולים בקטגוריה זו</h3><p>הוסיפו טיולים ל-trips.json</p></div>`;
        return;
    }

    grid.innerHTML = trips.map(trip => {
        const ages = getKidsAgesAtTrip(trip);
        const status = getTripStatus(trip);
        const statusLabel = status === 'past' ? '✅ בוצע' : '🔜 מתוכנן';
        const statusClass = status === 'past' ? 'status-past' : 'status-future';
        return `
            <article class="trip-card ${statusClass}" data-trip-id="${trip.id}">
                <img class="trip-card-image" src="${trip.coverImage}" alt="${trip.title}" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22><rect fill=%22%23dbeafe%22 width=%22800%22 height=%22400%22/><text x=%22400%22 y=%22200%22 text-anchor=%22middle%22 fill=%22%232563eb%22 font-size=%2248%22>✈️ ${trip.location}</text></svg>'">
                <span class="status-badge ${statusClass}">${statusLabel}</span>
                <div class="trip-card-body">
                    <div class="trip-card-location">📍 ${trip.location}</div>
                    <h3 class="trip-card-title">${trip.title}</h3>
                    <div class="trip-card-meta">
                        <span>📅 ${formatDateRange(trip.dates)}</span>
                        <span>⏱️ ${getTripDuration(trip.dates)}</span>
                    </div>
                    <div class="trip-card-ages">
                        ${ages.map(a => `<span class="age-tag">${a.gender === 'boy' ? '👦' : '👧'} ${a.name}: ${formatAge(a.age)}</span>`).join('')}
                    </div>
                    <span class="source-tag">📄 ${trip.source}</span>
                    ${trip.instagram && (Array.isArray(trip.instagram) ? trip.instagram.length : trip.instagram) ? `<a href="${Array.isArray(trip.instagram) ? trip.instagram[0] : trip.instagram}" target="_blank" class="instagram-badge" onclick="event.stopPropagation()">📸</a>` : ''}
                </div>
            </article>`;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.trip-card').forEach(card => {
        card.addEventListener('click', () => {
            const tripId = card.dataset.tripId;
            showTripDetail(tripId);
        });
    });
}

// Show trip detail view
function showTripDetail(tripId) {
    currentTrip = tripsData.trips.find(t => t.id === tripId);
    if (!currentTrip) return;

    document.getElementById('tripsGrid').style.display = 'none';
    document.querySelector('.filter-bar').style.display = 'none';
    const detail = document.getElementById('tripDetail');
    detail.classList.remove('hidden');

    const isHotelOverview = currentTrip.hotelOverview;
    const hasBookings = currentTrip.bookings && currentTrip.bookings.length > 0;

    // Show/hide tabs based on trip type
    document.querySelector('[data-tab="schedule"]').style.display = isHotelOverview ? 'none' : '';
    document.querySelector('[data-tab="map"]').style.display = isHotelOverview ? 'none' : '';
    document.querySelector('[data-tab="bookings"]').style.display = hasBookings ? '' : 'none';

    renderTripHeader();
    if (!isHotelOverview) {
        renderSchedule();
    }
    renderAttractions();
    if (hasBookings) {
        renderBookings();
    }
    renderNotes();
    
    // Reset to appropriate first tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    if (isHotelOverview) {
        document.querySelector('[data-tab="notes"]').classList.add('active');
        document.getElementById('notesPanel').classList.add('active');
    } else {
        document.querySelector('[data-tab="schedule"]').classList.add('active');
        document.getElementById('schedulePanel').classList.add('active');
    }

    window.scrollTo(0, 0);
}

// Render trip header
function renderTripHeader() {
    const header = document.getElementById('tripHeader');
    const ages = getKidsAgesAtTrip(currentTrip);
    header.innerHTML = `
        <h2>${currentTrip.title}</h2>
        <div class="meta">
            <span>📍 ${currentTrip.location}</span>
            <span>📅 ${formatDateRange(currentTrip.dates)}</span>
            <span>⏱️ ${getTripDuration(currentTrip.dates)}</span>
            <span>👨‍👩‍👧‍👦 ${ages.map(a => `${a.gender === 'boy' ? '👦' : '👧'} ${a.name} (${formatAge(a.age)})`).join('  ')}</span>
            ${currentTrip.instagram ? (Array.isArray(currentTrip.instagram) 
                ? currentTrip.instagram.map((url, i) => `<a href="${url}" target="_blank" class="instagram-link">📸 Highlight ${i+1}</a>`).join(' ')
                : `<a href="${currentTrip.instagram}" target="_blank" class="instagram-link">📸 Instagram Highlights</a>`) : ''}
            ${currentTrip.googleMap ? `<a href="${currentTrip.googleMap}" target="_blank" class="google-map-link">🗺️ מפת Google</a>` : ''}
        </div>
        <p class="summary">${currentTrip.summary}</p>`;
}

// Render schedule
function renderSchedule() {
    const panel = document.getElementById('schedulePanel');
    if (!currentTrip.schedule || currentTrip.schedule.length === 0) {
        panel.innerHTML = '<p>אין לוח זמנים לטיול זה.</p>';
        return;
    }

    const first = currentTrip.schedule[0];
    
    if (first.title && Array.isArray(first.activities)) {
        // Old format: convert to bullet style too
        panel.innerHTML = currentTrip.schedule.map(day => `
            <div class="day-card">
                <h3>${day.title}</h3>
                <ul class="schedule-bullets">
                    ${day.activities.map(act => `
                        <li>${act.activity}</li>`).join('')}
                </ul>
            </div>`).join('');
    } else {
        // Simple format: { day, activities (string), notes }
        panel.innerHTML = currentTrip.schedule.map(day => `
            <div class="day-card">
                <h3>${day.day}</h3>
                <ul class="schedule-bullets">
                    <li>${day.activities}</li>
                    ${day.notes ? `<li class="day-notes">💡 ${day.notes}</li>` : ''}
                </ul>
            </div>`).join('');
    }
}

// Render map
function renderMap() {
    const mapDiv = document.getElementById('map');
    
    // If trip has a Google My Maps link, embed it directly
    if (currentTrip.googleMap) {
        const match = currentTrip.googleMap.match(/mid=([^&]+)/);
        if (match) {
            mapDiv.innerHTML = `<iframe src="https://www.google.com/maps/d/embed?mid=${match[1]}&ehbc=2E312F" 
                width="100%" height="100%" style="border:0;min-height:500px;" allowfullscreen loading="lazy"></iframe>
                <div style="padding:8px;text-align:center;">
                    <a href="${currentTrip.googleMap}" target="_blank" class="google-map-link">🗺️ פתח במפות Google</a>
                </div>`;
            return;
        }
        // Non-embeddable Google Maps link (saved list etc.) - show link + regular map
    }

    // Collect all points
    const points = [];
    
    if (currentTrip.hotels) {
        currentTrip.hotels.forEach(h => {
            points.push({ lat: h.lat, lng: h.lng, name: h.name, type: 'hotel', link: h.link, notes: h.notes });
        });
    }
    
    if (currentTrip.attractions) {
        currentTrip.attractions.forEach(a => {
            points.push({ lat: a.lat, lng: a.lng, name: a.name, type: 'attraction', link: a.link, notes: a.notes });
        });
    }

    if (points.length === 0) {
        mapDiv.innerHTML = '<p style="padding:20px;">אין נקודות מפה לטיול זה.</p>';
        return;
    }

    // Build Google Maps embed with all points as place links
    const typeEmoji = { hotel: '🏨', attraction: '⭐', food: '🍽️', kids: '🎠' };
    const typeColor = { hotel: '#ea4335', attraction: '#4285f4', food: '#fbbc04', kids: '#34a853' };

    // Center map on first hotel or average of points
    const centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const centerLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

    // Embed Google Maps centered on the trip location
    const mapQuery = encodeURIComponent(currentTrip.location);
    
    // Build markers list for the sidebar
    const markersList = points.map(p => {
        const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
        return `<a href="${gmapsUrl}" target="_blank" class="map-place-link" style="border-right: 3px solid ${typeColor[p.type] || typeColor.attraction}">
            <span class="map-place-emoji">${typeEmoji[p.type] || '📌'}</span>
            <span class="map-place-name">${p.name}</span>
        </a>`;
    }).join('');

    mapDiv.innerHTML = `
        <div class="google-map-container">
            ${currentTrip.googleMap ? `<div style="padding:12px;text-align:center;background:#f0f7ff;border-bottom:1px solid #e2e8f0;">
                <a href="${currentTrip.googleMap}" target="_blank" class="google-map-link">🗺️ פתח את המפה המלאה ב-Google Maps</a>
            </div>` : ''}
            <iframe src="https://maps.google.com/maps?q=${mapQuery}&z=9&output=embed&hl=he" 
                width="100%" height="100%" style="border:0;min-height:450px;" allowfullscreen loading="lazy"></iframe>
            <div class="map-places-panel">
                <h4>📍 מקומות בטיול</h4>
                ${markersList}
            </div>
        </div>`;
}

// Render attractions
function renderAttractions() {
    const panel = document.getElementById('attractionsPanel');
    if (!currentTrip.attractions || currentTrip.attractions.length === 0) {
        panel.innerHTML = '<p>No attractions listed yet.</p>';
        return;
    }

    panel.innerHTML = currentTrip.attractions.map(attr => `
        <div class="attraction-card">
            <h4>${attr.name} ${attr.link ? `<a href="${attr.link}" target="_blank" class="site-link">🔗 אתר</a>` : ''}</h4>
            <span class="attraction-type">${attr.type}</span>
            <span class="kid-rating">${'⭐'.repeat(attr.kidFriendly)} (${attr.kidFriendly}/5)</span>
            ${attr.notes ? `<div class="attraction-notes">📝 ${attr.notes}</div>` : ''}
        </div>`).join('');
}

// Bookings password gate (client-side, light protection only)
const BOOKINGS_HASH = '9113b98df80f877c7a2ee5d865a04c9514b4e9bf25a49d315b0b15f115d2f0d2';

async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function isBookingsUnlocked() {
    return sessionStorage.getItem('bookingsUnlocked') === '1';
}

async function unlockBookings() {
    if (isBookingsUnlocked()) return true;
    const input = prompt('🔒 הזינו סיסמה לצפייה בהזמנות:');
    if (input === null) return false;
    const ok = (await sha256Hex(input)) === BOOKINGS_HASH;
    if (ok) {
        sessionStorage.setItem('bookingsUnlocked', '1');
    } else {
        alert('סיסמה שגויה.');
    }
    return ok;
}

// Render bookings grouped by family
function renderBookings() {
    const panel = document.getElementById('bookingsPanel');
    if (!isBookingsUnlocked()) {
        panel.innerHTML = '<p class="booking-empty">🔒 יש להזין סיסמה כדי לצפות בהזמנות.</p>';
        return;
    }
    const families = currentTrip.bookings;
    if (!families || families.length === 0) {
        panel.innerHTML = '<p>אין הזמנות עדיין.</p>';
        return;
    }

    const typeIcon = { flight: '✈️', hotel: '🏨', ticket: '🎟️', car: '🚗', food: '🍽️', other: '📦' };

    panel.innerHTML = families.map(fam => `
        <div class="booking-family">
            <h3>👨‍👩‍👧‍👦 ${fam.family}</h3>
            ${(fam.items && fam.items.length > 0) ? `
                <div class="booking-items">
                    ${fam.items.map(b => `
                        <div class="booking-card">
                            <div class="booking-card-head">
                                <span class="booking-type">${typeIcon[b.type] || '📦'}</span>
                                <strong>${b.title}</strong>
                                ${b.link ? `<a href="${b.link}" target="_blank" class="site-link">🔗 קישור</a>` : ''}
                            </div>
                            <div class="booking-meta">
                                ${b.dates ? `<span>📅 ${b.dates}</span>` : ''}
                                ${b.confirmation ? `<span>🔖 ${b.confirmation}</span>` : ''}
                                ${b.price ? `<span>💶 ${b.price}</span>` : ''}
                            </div>
                            ${b.notes ? `<details class="booking-notes"><summary>📝 פרטים נוספים</summary><div class="attraction-notes">${b.notes}</div></details>` : ''}
                        </div>`).join('')}
                </div>` : `<p class="booking-empty">טרם הוזנו הזמנות למשפחה זו.</p>`}
        </div>`).join('');
}

// Render notes and tips
function renderNotes() {
    const panel = document.getElementById('notesPanel');
    let html = '';

    if (currentTrip.notes) {
        html += `
            <div class="notes-section">
                <h3>📝 Personal Notes</h3>
                <p>${currentTrip.notes}</p>
            </div>`;
    }

    if (currentTrip.tips && currentTrip.tips.length > 0) {
        html += `
            <div class="notes-section">
                <h3>💡 Tips & Recommendations</h3>
                <ul class="tips-list">
                    ${currentTrip.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>`;
    }

    if (currentTrip.hotels && currentTrip.hotels.length > 0) {
        html += `
            <div class="notes-section">
                <h3>🏨 מלונות</h3>
                ${currentTrip.hotels.map(h => `
                    <div style="margin-bottom:12px;">
                        <strong>${h.name}</strong> (${h.nights} לילות) ${h.link ? `<a href="${h.link}" target="_blank" class="site-link">🔗 אתר</a>` : ''}<br>
                        <span style="color:var(--text-light)">${h.address}</span>
                        ${h.notes ? `<div class="attraction-notes" style="margin-top:6px;">📝 ${h.notes}</div>` : ''}
                    </div>`).join('')}
            </div>`;
    }

    if (!html) {
        html = '<p>No notes added yet for this trip.</p>';
    }

    panel.innerHTML = html;
}

// Setup filter buttons
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTripsGrid(btn.dataset.filter);
        });
    });
}

// Setup navigation (back button, tabs)
function setupNavigation() {
    document.getElementById('backBtn').addEventListener('click', () => {
        document.getElementById('tripDetail').classList.add('hidden');
        document.getElementById('tripsGrid').style.display = '';
        document.querySelector('.filter-bar').style.display = '';
        currentTrip = null;
        if (map) {
            map.remove();
            map = null;
        }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.dataset.tab === 'bookings' && !(await unlockBookings())) {
                return;
            }
            if (btn.dataset.tab === 'bookings') {
                renderBookings();
            }
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(`${btn.dataset.tab}Panel`);
            panel.classList.add('active');

            // Initialize map when map tab is clicked
            if (btn.dataset.tab === 'map') {
                setTimeout(() => renderMap(), 100);
            }
        });
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
