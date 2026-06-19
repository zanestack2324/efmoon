(function() {
  'use strict';

  const TOKEN = localStorage.getItem('efm_token');
  if (!TOKEN) { window.location.href = 'index.html'; return; }

  const user = JSON.parse(localStorage.getItem('efm_user') || '{}');
  const contentArea = document.getElementById('contentArea');
  const pageTitle = document.getElementById('pageTitle');

  // ===== API HELPER =====
  async function api(method, path, body) {
    const opts = {
      method,
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ===== TOAST =====
  function toast(msg, type = 'success') {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ===== NAVIGATION =====
  const sectionTitles = {
    overview: 'Overview', bio: 'Bio Editor', tracks: 'Music Tracks',
    tour: 'Tour Dates', merch: 'Merch', uploads: 'File Uploads', settings: 'Settings',
    messages: 'Fan Messages', orders: 'Merch Orders', fanwall: 'Fan Wall',
    challenge: 'Superfans Challenge', guidance: 'Guidance'
  };

  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item[data-section]').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const section = item.dataset.section;
      pageTitle.textContent = sectionTitles[section] || section;
      loadSection(section);
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Sidebar toggle on mobile
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('efm_token');
    localStorage.removeItem('efm_user');
    window.location.href = 'index.html';
  });

  // User badge
  document.getElementById('userBadge').textContent = `@${user.username || 'admin'}`;

  // ===== RENDER SECTION =====
  function loadSection(section) {
    switch(section) {
      case 'overview': renderOverview(); break;
      case 'bio': renderBioEditor(); break;
      case 'tracks': renderTracks(); break;
      case 'tour': renderTour(); break;
      case 'merch': renderMerch(); break;
      case 'uploads': renderUploads(); break;
      case 'messages': renderMessages(); break;
      case 'orders': renderOrders(); break;
      case 'fanwall': renderFanWall(); break;
      case 'challenge': renderChallenge(); break;
      case 'guidance': renderGuidance(); break;
      case 'settings': renderSettings(); break;
    }
  }

  // ===== OVERVIEW =====
  async function renderOverview() {
    try {
      const [tracks, tour, settings] = await Promise.all([
        api('GET', '/content/tracks'),
        api('GET', '/content/tour'),
        api('GET', '/content/settings')
      ]);
      contentArea.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><span class="num">${tracks.length}</span><span class="label">Tracks</span></div>
          <div class="stat-card"><span class="num">${tour.length}</span><span class="label">Tour Dates</span></div>
          <div class="stat-card"><span class="num">${settings.stats?.followers || '0'}</span><span class="label">Followers</span></div>
          <div class="stat-card"><span class="num">${settings.stats?.singles || '0'}</span><span class="label">Singles</span></div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;">
          <p style="color:var(--text2);font-size:0.9rem;">Welcome back, <strong style="color:var(--gold);">${user.username || 'Admin'}</strong>. Use the sidebar to manage your content.</p>
          <p style="color:var(--text2);font-size:0.8rem;margin-top:12px;">Quick links: <a href="/" target="_blank">View Site</a> · <a href="https://vercel.com" target="_blank">Vercel Dashboard</a></p>
        </div>`;
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load overview</p>'; }
  }

  // ===== BIO EDITOR =====
  async function renderBioEditor() {
    try {
      const settings = await api('GET', '/content/settings');
      const s = settings.stats || {};
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header"><h3>Edit Bio</h3></div>
          <div style="padding:20px;">
            <form id="bioForm">
              <div class="form-group">
                <label>Bio Text</label>
                <textarea id="bioText" rows="6">${settings.bio || ''}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group"><label>Followers</label><input type="text" id="statFollowers" value="${s.followers || '28K+'}"></div>
                <div class="form-group"><label>Singles</label><input type="text" id="statSingles" value="${s.singles || '15+'}"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label>Albums</label><input type="text" id="statAlbums" value="${s.album || '1'}"></div>
                <div class="form-group"><label>Since</label><input type="text" id="statSince" value="${s.since || '2023'}"></div>
              </div>
              <button type="submit" class="btn btn-gold">Save Bio</button>
            </form>
            <div id="bioSaved" class="success-msg"></div>
          </div>
        </div>`;

      document.getElementById('bioForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('bioText').value;
        const stats = {
          followers: document.getElementById('statFollowers').value,
          singles: document.getElementById('statSingles').value,
          album: document.getElementById('statAlbums').value,
          since: document.getElementById('statSince').value
        };
        try {
          await api('POST', '/content/bio', { text, stats });
          document.getElementById('bioSaved').textContent = '✓ Bio saved!';
          toast('Bio updated');
        } catch { toast('Failed to save bio', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load bio editor</p>'; }
  }

  // ===== TRACKS =====
  async function renderTracks() {
    try {
      const tracks = await api('GET', '/content/tracks');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header">
            <h3>Music Tracks (${tracks.length})</h3>
            <button class="btn btn-gold btn-sm" id="addTrackBtn">+ Add Track</button>
          </div>
          ${tracks.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>No tracks yet. Add your first track!</p></div>' : `
          <table>
            <thead><tr><th>#</th><th>Title</th><th>Artist</th><th>YouTube ID</th><th>Actions</th></tr></thead>
            <tbody>${tracks.map((t, i) => `
              <tr>
                <td>${String(i+1).padStart(2,'0')}</td>
                <td>${t.title || t.name || 'Untitled'}</td>
                <td>${t.artist || '-'}</td>
                <td style="font-family:monospace;font-size:0.8rem;">${t.videoId || '-'}</td>
                <td class="actions">
                  <button class="btn btn-outline btn-sm" onclick="editTrack('${t.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteTrack('${t.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>
        <div class="modal-overlay" id="trackModal"><div class="modal">
          <h3 id="trackModalTitle">Add Track</h3>
          <form id="trackForm">
            <div class="form-group"><label>Track Title</label><input type="text" id="trackTitle" required></div>
            <div class="form-group"><label>Artist(s)</label><input type="text" id="trackArtist" placeholder="EF Moon, Star Jay"></div>
            <div class="form-group"><label>YouTube Video ID</label><input type="text" id="trackVideoId" placeholder="e.g. 7CD17J4V44A"></div>
            <div class="form-group"><label>Track Number</label><input type="number" id="trackNumber" min="1"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="trackModalCancel">Cancel</button>
              <button type="submit" class="btn btn-gold">Save Track</button>
            </div>
          </form>
        </div></div>`;

      // Modal handlers
      let editingTrackId = null;
      window.editTrack = async (id) => {
        const t = tracks.find(x => x.id === id);
        if (!t) return;
        editingTrackId = id;
        document.getElementById('trackModalTitle').textContent = 'Edit Track';
        document.getElementById('trackTitle').value = t.title || t.name || '';
        document.getElementById('trackArtist').value = t.artist || '';
        document.getElementById('trackVideoId').value = t.videoId || '';
        document.getElementById('trackNumber').value = t.number || '';
        document.getElementById('trackModal').classList.add('open');
      };
      window.deleteTrack = async (id) => {
        if (!confirm('Delete this track?')) return;
        try { await api('DELETE', `/content/tracks/${id}`); toast('Track deleted'); renderTracks(); }
        catch { toast('Failed to delete', 'error'); }
      };

      document.getElementById('addTrackBtn').addEventListener('click', () => {
        editingTrackId = null;
        document.getElementById('trackModalTitle').textContent = 'Add Track';
        document.getElementById('trackForm').reset();
        document.getElementById('trackModal').classList.add('open');
      });
      document.getElementById('trackModalCancel').addEventListener('click', () => {
        document.getElementById('trackModal').classList.remove('open');
      });
      document.getElementById('trackForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          title: document.getElementById('trackTitle').value,
          artist: document.getElementById('trackArtist').value,
          videoId: document.getElementById('trackVideoId').value,
          number: document.getElementById('trackNumber').value
        };
        try {
          if (editingTrackId) {
            await api('PUT', `/content/tracks/${editingTrackId}`, data);
            toast('Track updated');
          } else {
            await api('POST', '/content/tracks', data);
            toast('Track added');
          }
          document.getElementById('trackModal').classList.remove('open');
          renderTracks();
        } catch { toast('Failed to save track', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load tracks</p>'; }
  }

  // ===== TOUR DATES =====
  async function renderTour() {
    try {
      const dates = await api('GET', '/content/tour');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header">
            <h3>Tour Dates (${dates.length})</h3>
            <button class="btn btn-gold btn-sm" id="addTourBtn">+ Add Date</button>
          </div>
          ${dates.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><p>No tour dates yet.</p></div>' : `
          <table>
            <thead><tr><th>Date</th><th>City</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${dates.map(d => `
              <tr>
                <td style="font-family:'Anton',sans-serif;color:var(--gold);">${d.date}</td>
                <td>${d.city}</td>
                <td>${d.venue || '-'}</td>
                <td><span style="color:${d.status === 'sold' ? 'var(--danger)' : 'var(--success)'};">${d.status === 'sold' ? 'Sold Out' : 'Available'}</span></td>
                <td class="actions">
                  <button class="btn btn-outline btn-sm" onclick="editTour('${d.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteTour('${d.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>
        <div class="modal-overlay" id="tourModal"><div class="modal">
          <h3 id="tourModalTitle">Add Tour Date</h3>
          <form id="tourForm">
            <div class="form-row">
              <div class="form-group"><label>Date</label><input type="text" id="tourDate" placeholder="15 AUG" required></div>
              <div class="form-group"><label>City</label><input type="text" id="tourCity" placeholder="London, UK" required></div>
            </div>
            <div class="form-group"><label>Venue</label><input type="text" id="tourVenue" placeholder="O2 Academy Brixton"></div>
            <div class="form-group"><label>Status</label><select id="tourStatus"><option value="avail">Available</option><option value="sold">Sold Out</option></select></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="tourModalCancel">Cancel</button>
              <button type="submit" class="btn btn-gold">Save Date</button>
            </div>
          </form>
        </div></div>`;

      let editingTourId = null;
      window.editTour = (id) => {
        const d = dates.find(x => x.id === id);
        if (!d) return;
        editingTourId = id;
        document.getElementById('tourModalTitle').textContent = 'Edit Tour Date';
        document.getElementById('tourDate').value = d.date;
        document.getElementById('tourCity').value = d.city;
        document.getElementById('tourVenue').value = d.venue || '';
        document.getElementById('tourStatus').value = d.status || 'avail';
        document.getElementById('tourModal').classList.add('open');
      };
      window.deleteTour = async (id) => {
        if (!confirm('Delete this tour date?')) return;
        try { await api('DELETE', `/content/tour/${id}`); toast('Tour date deleted'); renderTour(); }
        catch { toast('Failed to delete', 'error'); }
      };

      document.getElementById('addTourBtn').addEventListener('click', () => {
        editingTourId = null;
        document.getElementById('tourModalTitle').textContent = 'Add Tour Date';
        document.getElementById('tourForm').reset();
        document.getElementById('tourModal').classList.add('open');
      });
      document.getElementById('tourModalCancel').addEventListener('click', () => {
        document.getElementById('tourModal').classList.remove('open');
      });
      document.getElementById('tourForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          date: document.getElementById('tourDate').value,
          city: document.getElementById('tourCity').value,
          venue: document.getElementById('tourVenue').value,
          status: document.getElementById('tourStatus').value
        };
        try {
          if (editingTourId) {
            await api('PUT', `/content/tour/${editingTourId}`, data);
            toast('Tour date updated');
          } else {
            await api('POST', '/content/tour', data);
            toast('Tour date added');
          }
          document.getElementById('tourModal').classList.remove('open');
          renderTour();
        } catch { toast('Failed to save tour date', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load tour dates</p>'; }
  }

  // ===== MERCH =====
  async function renderMerch() {
    try {
      const merch = await api('GET', '/content/merch');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header">
            <h3>Merch Items (${merch.length})</h3>
            <button class="btn btn-gold btn-sm" id="addMerchBtn">+ Add Item</button>
          </div>
          ${merch.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><p>No merch items yet.</p></div>' : `
          <table>
            <thead><tr><th>Item</th><th>Price</th><th>Image</th><th>Actions</th></tr></thead>
            <tbody>${merch.map(m => `
              <tr>
                <td>${m.name || 'Untitled'}</td>
                <td style="color:var(--gold);font-family:'Anton',sans-serif;">${m.price ? '₦'+m.price : '-'}</td>
                <td>${m.image ? `<img src="${m.image}" style="height:40px;width:40px;object-fit:cover;border-radius:4px;">` : '-'}</td>
                <td class="actions">
                  <button class="btn btn-outline btn-sm" onclick="editMerch('${m.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteMerch('${m.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>
        <div class="modal-overlay" id="merchModal"><div class="modal">
          <h3 id="merchModalTitle">Add Merch Item</h3>
          <form id="merchForm">
            <div class="form-group"><label>Item Name</label><input type="text" id="merchName" required></div>
            <div class="form-row">
              <div class="form-group"><label>Price (₦)</label><input type="text" id="merchPrice"></div>
              <div class="form-group"><label>Image URL</label><input type="text" id="merchImage" placeholder="/uploads/..."></div>
            </div>
            <div class="form-group"><label>Description</label><textarea id="merchDesc" rows="2"></textarea></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="merchModalCancel">Cancel</button>
              <button type="submit" class="btn btn-gold">Save Item</button>
            </div>
          </form>
        </div></div>`;

      let editingMerchId = null;
      window.editMerch = (id) => {
        const m = merch.find(x => x.id === id);
        if (!m) return;
        editingMerchId = id;
        document.getElementById('merchModalTitle').textContent = 'Edit Merch Item';
        document.getElementById('merchName').value = m.name || '';
        document.getElementById('merchPrice').value = m.price || '';
        document.getElementById('merchImage').value = m.image || '';
        document.getElementById('merchDesc').value = m.description || '';
        document.getElementById('merchModal').classList.add('open');
      };
      window.deleteMerch = async (id) => {
        if (!confirm('Delete this item?')) return;
        try { await api('DELETE', `/content/merch/${id}`); toast('Item deleted'); renderMerch(); }
        catch { toast('Failed to delete', 'error'); }
      };

      document.getElementById('addMerchBtn').addEventListener('click', () => {
        editingMerchId = null;
        document.getElementById('merchModalTitle').textContent = 'Add Merch Item';
        document.getElementById('merchForm').reset();
        document.getElementById('merchModal').classList.add('open');
      });
      document.getElementById('merchModalCancel').addEventListener('click', () => {
        document.getElementById('merchModal').classList.remove('open');
      });
      document.getElementById('merchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          name: document.getElementById('merchName').value,
          price: document.getElementById('merchPrice').value,
          image: document.getElementById('merchImage').value,
          description: document.getElementById('merchDesc').value
        };
        try {
          if (editingMerchId) {
            await api('PUT', `/content/merch/${editingMerchId}`, data);
            toast('Item updated');
          } else {
            await api('POST', '/content/merch', data);
            toast('Item added');
          }
          document.getElementById('merchModal').classList.remove('open');
          renderMerch();
        } catch { toast('Failed to save item', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load merch</p>'; }
  }

  // ===== UPLOADS =====
  async function renderUploads() {
    try {
      const files = await api('GET', '/upload/list');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header">
            <h3>Uploaded Files (${files.length})</h3>
            <button class="btn btn-gold btn-sm" id="uploadBtn">+ Upload File</button>
          </div>
          ${files.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>No files uploaded yet.</p></div>' : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;padding:16px;">
            ${files.map(f => {
              const isImage = f.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
              return `<div style="background:var(--bg3);border-radius:8px;overflow:hidden;border:1px solid var(--border);">
                ${isImage ? `<img src="${f.url}" style="width:100%;height:120px;object-fit:cover;display:block;" loading="lazy">` : '<div style="height:120px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:0.7rem;">FILE</div>'}
                <div style="padding:8px;">
                  <p style="font-size:0.7rem;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</p>
                  <p style="font-size:0.6rem;color:var(--text3);">${(f.size/1024).toFixed(0)}KB</p>
                  <button class="btn btn-danger btn-sm" style="width:100%;margin-top:4px;" onclick="deleteUpload('${f.name}')">Delete</button>
                  <button class="btn btn-outline btn-sm" style="width:100%;margin-top:4px;" onclick="navigator.clipboard.writeText('${f.url}');toast('URL copied')">Copy URL</button>
                </div>
              </div>`;
            }).join('')}
          </div>`}
        </div>
        <div class="modal-overlay" id="uploadModal"><div class="modal">
          <h3>Upload File</h3>
          <form id="uploadForm">
            <div class="form-group"><label>Select File</label><input type="file" id="uploadFileInput" required></div>
            <div id="uploadPreview" class="upload-preview"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="uploadModalCancel">Cancel</button>
              <button type="submit" class="btn btn-gold" id="uploadSubmitBtn">Upload</button>
            </div>
          </form>
        </div></div>`;

      document.getElementById('uploadBtn')?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.add('open');
      });
      document.getElementById('uploadModalCancel')?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.remove('open');
      });
      document.getElementById('uploadFileInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('uploadPreview');
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => { preview.innerHTML = `<img src="${ev.target.result}" style="max-width:200px;max-height:200px;border-radius:8px;">`; };
          reader.readAsDataURL(file);
        } else { preview.innerHTML = ''; }
      });
      document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('uploadFileInput');
        const file = fileInput.files[0];
        if (!file) return;
        const btn = document.getElementById('uploadSubmitBtn');
        btn.disabled = true; btn.textContent = 'Uploading...';
        try {
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const base64 = ev.target.result;
            const result = await api('POST', '/upload', { file: base64, name: file.name, type: file.type });
            toast(`Uploaded: ${result.url}`);
            document.getElementById('uploadModal').classList.remove('open');
            renderUploads();
          };
          reader.readAsDataURL(file);
        } catch { toast('Upload failed', 'error'); }
        btn.disabled = false; btn.textContent = 'Upload';
      });
      window.deleteUpload = async (name) => {
        if (!confirm(`Delete ${name}?`)) return;
        try { await api('DELETE', `/upload/${encodeURIComponent(name)}`); toast('File deleted'); renderUploads(); }
        catch { toast('Failed to delete', 'error'); }
      };
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load uploads</p>'; }
  }

  // ===== SETTINGS =====
  async function renderSettings() {
    try {
      const settings = await api('GET', '/content/settings');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header"><h3>Site Settings</h3></div>
          <div style="padding:20px;">
            <form id="settingsForm">
              <div class="form-row">
                <div class="form-group"><label>Site Title</label><input type="text" id="setSiteName" value="${settings.siteName || 'EF MOON'}"></div>
                <div class="form-group"><label>Tagline</label><input type="text" id="setTagline" value="${settings.tagline || 'The Moonite Era'}"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label>Album Title</label><input type="text" id="setAlbumTitle" value="${settings.albumTitle || 'MOON 1'}"></div>
                <div class="form-group"><label>Release Date</label><input type="date" id="setReleaseDate" value="${settings.releaseDate || '2026-07-17'}"></div>
              </div>
              <div class="form-group"><label>Hero Tagline</label><input type="text" id="setHeroTagline" value="${settings.heroTagline || 'The Moonite Era'}"></div>
              <button type="submit" class="btn btn-gold">Save Settings</button>
            </form>
            <div id="settingsSaved" class="success-msg"></div>
          </div>
        </div>
        <div class="table-wrap" style="margin-top:16px;">
          <div class="table-header"><h3>Account</h3></div>
          <div style="padding:20px;">
            <form id="passwordForm">
              <div class="form-row">
                <div class="form-group"><label>Current Password</label><input type="password" id="curPw" required></div>
                <div class="form-group"><label>New Password</label><input type="password" id="newPw" required></div>
              </div>
              <button type="submit" class="btn btn-outline">Change Password</button>
            </form>
            <div id="pwSaved" class="success-msg"></div>
          </div>
        </div>`;

      document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api('POST', '/content/settings', {
            siteName: document.getElementById('setSiteName').value,
            tagline: document.getElementById('setTagline').value,
            albumTitle: document.getElementById('setAlbumTitle').value,
            releaseDate: document.getElementById('setReleaseDate').value,
            heroTagline: document.getElementById('setHeroTagline').value
          });
          document.getElementById('settingsSaved').textContent = '✓ Settings saved!';
          toast('Settings updated');
        } catch { toast('Failed to save settings', 'error'); }
      });

      document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api('POST', '/auth/change-password', {
            currentPassword: document.getElementById('curPw').value,
            newPassword: document.getElementById('newPw').value
          });
          document.getElementById('pwSaved').textContent = '✓ Password changed!';
          document.getElementById('passwordForm').reset();
          toast('Password changed');
        } catch { toast('Failed to change password', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load settings</p>'; }
  }

  // ===== MESSAGES =====
  async function renderMessages() {
    try {
      const msgs = await api('GET', '/contact');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header"><h3>Fan Messages (${msgs.length})</h3></div>
          ${msgs.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>No messages yet.</p></div>' : `
          <table>
            <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Message</th><th>Actions</th></tr></thead>
            <tbody>${msgs.map(m => `
              <tr style="${m.read ? 'opacity:0.5;' : ''}">
                <td style="font-size:0.75rem;white-space:nowrap;">${new Date(m.date).toLocaleDateString()}</td>
                <td><strong>${m.name}</strong></td>
                <td style="font-size:0.75rem;">${m.email}</td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.message}</td>
                <td class="actions">
                  <button class="btn btn-outline btn-sm" onclick="viewMessage('${m.id}')">View</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteMessage('${m.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>
        <div class="modal-overlay" id="msgModal"><div class="modal">
          <h3>Message Details</h3>
          <div id="msgDetail"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="msgModalClose">Close</button>
          </div>
        </div></div>`;

      window.viewMessage = async (id) => {
        const m = msgs.find(x => x.id === id);
        if (!m) return;
        document.getElementById('msgDetail').innerHTML = `
          <p style="color:var(--text2);font-size:0.75rem;margin-bottom:4px;">From: <strong style="color:var(--text);">${m.name}</strong></p>
          <p style="color:var(--text2);font-size:0.75rem;margin-bottom:4px;">Email: <strong style="color:var(--text);">${m.email}</strong></p>
          <p style="color:var(--text2);font-size:0.75rem;margin-bottom:16px;">Date: <strong style="color:var(--text);">${new Date(m.date).toLocaleString()}</strong></p>
          <div style="background:var(--bg3);padding:16px;border-radius:8px;font-size:0.9rem;line-height:1.6;">${m.message}</div>`;
        document.getElementById('msgModal').classList.add('open');
        if (!m.read) {
          await api('PUT', `/contact/${id}/read`);
        }
      };
      window.deleteMessage = async (id) => {
        if (!confirm('Delete this message?')) return;
        try { await api('DELETE', `/contact/${id}`); toast('Message deleted'); renderMessages(); }
        catch { toast('Failed to delete', 'error'); }
      };
      document.getElementById('msgModalClose')?.addEventListener('click', () => {
        document.getElementById('msgModal').classList.remove('open');
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load messages</p>'; }
  }

  // ===== ORDERS =====
  async function renderOrders() {
    try {
      const orders = await api('GET', '/orders');
      const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
      contentArea.innerHTML = `
        <div class="stats-grid" style="margin-bottom:16px;">
          <div class="stat-card"><span class="num">${orders.length}</span><span class="label">Total Orders</span></div>
          <div class="stat-card"><span class="num">₦${totalRevenue.toLocaleString()}</span><span class="label">Revenue</span></div>
          <div class="stat-card"><span class="num">${orders.filter(o => o.status === 'pending').length}</span><span class="label">Pending</span></div>
        </div>
        <div class="table-wrap">
          <div class="table-header"><h3>Merch Orders</h3></div>
          ${orders.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><p>No orders yet.</p></div>' : `
          <table>
            <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${orders.map(o => `
              <tr>
                <td style="font-size:0.75rem;white-space:nowrap;">${new Date(o.date).toLocaleDateString()}</td>
                <td><strong>${o.name}</strong><br><span style="font-size:0.7rem;color:var(--text3);">${o.email}</span></td>
                <td style="font-size:0.8rem;">${o.items.map(i => `${i.name} x${i.qty || 1}`).join(', ')}</td>
                <td style="color:var(--gold);font-family:'Anton',sans-serif;">₦${o.total.toLocaleString()}</td>
                <td><span style="color:${o.status === 'completed' ? 'var(--success)' : o.status === 'cancelled' ? 'var(--danger)' : 'var(--gold)'};">${o.status}</span></td>
                <td class="actions">
                  <select onchange="updateOrderStatus('${o.id}', this.value)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:4px 8px;border-radius:4px;font-size:0.75rem;">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                  <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>`;

      window.updateOrderStatus = async (id, status) => {
        try { await api('PUT', `/orders/${id}/status`, { status }); toast('Order status updated'); renderOrders(); }
        catch { toast('Failed to update', 'error'); }
      };
      window.deleteOrder = async (id) => {
        if (!confirm('Delete this order?')) return;
        try { await api('DELETE', `/orders/${id}`); toast('Order deleted'); renderOrders(); }
        catch { toast('Failed to delete', 'error'); }
      };
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load orders</p>'; }
  }

  // ===== FAN WALL =====
  async function renderFanWall() {
    try {
      const posts = await api('GET', '/interact');
      const approved = posts.filter(p => p.approved).length;
      const pending = posts.filter(p => !p.approved).length;
      contentArea.innerHTML = `
        <div class="stats-grid" style="margin-bottom:16px;">
          <div class="stat-card"><span class="num">${posts.length}</span><span class="label">Total Posts</span></div>
          <div class="stat-card"><span class="num">${approved}</span><span class="label">Approved</span></div>
          <div class="stat-card"><span class="num">${pending}</span><span class="label">Pending</span></div>
        </div>
        <div class="table-wrap">
          <div class="table-header"><h3>Fan Wall Posts</h3></div>
          ${posts.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><p>No fan posts yet.</p></div>' : `
          <table>
            <thead><tr><th>Date</th><th>Name</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${posts.map(p => `
              <tr style="${!p.approved ? 'opacity:0.6;' : ''}">
                <td style="font-size:0.75rem;white-space:nowrap;">${new Date(p.date).toLocaleDateString()}</td>
                <td><strong>${p.name}</strong></td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.message}</td>
                <td><span style="color:${p.approved ? 'var(--success)' : 'var(--danger)'};">${p.approved ? 'Approved' : 'Pending'}</span></td>
                <td class="actions">
                  <button class="btn ${p.approved ? 'btn-danger' : 'btn-gold'} btn-sm" onclick="toggleApprove('${p.id}')">${p.approved ? 'Unapprove' : 'Approve'}</button>
                  <button class="btn btn-danger btn-sm" onclick="deletePost('${p.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>`;

      window.toggleApprove = async (id) => {
        try { await api('PUT', `/interact/${id}/approve`); toast('Updated'); renderFanWall(); }
        catch { toast('Failed to update', 'error'); }
      };
      window.deletePost = async (id) => {
        if (!confirm('Delete this post?')) return;
        try { await api('DELETE', `/interact/${id}`); toast('Post deleted'); renderFanWall(); }
        catch { toast('Failed to delete', 'error'); }
      };
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load fan wall</p>'; }
  }

  // ===== CHALLENGE =====
  async function renderChallenge() {
    try {
      const [questions, results] = await Promise.all([
        api('GET', '/challenge/questions/all'),
        api('GET', '/challenge/results')
      ]);
      const topScores = [...results].sort((a, b) => b.score - a.score).slice(0, 5);
      contentArea.innerHTML = `
        <div class="stats-grid" style="margin-bottom:16px;">
          <div class="stat-card"><span class="num">${questions.length}</span><span class="label">Questions</span></div>
          <div class="stat-card"><span class="num">${results.length}</span><span class="label">Participants</span></div>
          <div class="stat-card"><span class="num">${topScores.length ? topScores[0].score + '%' : '-'}</span><span class="label">Top Score</span></div>
        </div>
        <div class="table-wrap" style="margin-bottom:16px;">
          <div class="table-header">
            <h3>Challenge Questions (${questions.length})</h3>
            <button class="btn btn-gold btn-sm" id="addQBtn">+ Add Question</button>
          </div>
          ${questions.length === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg><p>No questions yet. Add your first challenge question!</p></div>' : `
          <table>
            <thead><tr><th>Question</th><th>Options</th><th>Answer</th><th>Actions</th></tr></thead>
            <tbody>${questions.map(q => `
              <tr>
                <td style="max-width:200px;">${q.question}</td>
                <td style="font-size:0.75rem;">${(q.options || []).join(', ')}</td>
                <td style="color:var(--success);font-size:0.8rem;">${q.answer}</td>
                <td class="actions">
                  <button class="btn btn-outline btn-sm" onclick="editQuestion('${q.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Delete</button>
                </td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>
        <div class="table-wrap">
          <div class="table-header"><h3>Leaderboard (Top ${topScores.length})</h3></div>
          ${topScores.length === 0 ? '<div class="empty-state"><p>No participants yet.</p></div>' : `
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>${topScores.map((s, i) => `
              <tr>
                <td style="color:var(--gold);font-family:'Anton',sans-serif;">#${i+1}</td>
                <td><strong>${s.name}</strong></td>
                <td style="color:var(--gold);font-family:'Anton',sans-serif;">${s.score}% (${s.correct}/${s.total})</td>
                <td style="font-size:0.75rem;">${new Date(s.date).toLocaleDateString()}</td>
              </tr>`).join('')}</tbody>
          </table>`}
        </div>
        <div class="modal-overlay" id="qModal"><div class="modal">
          <h3 id="qModalTitle">Add Question</h3>
          <form id="qForm">
            <div class="form-group"><label>Question</label><input type="text" id="qText" required></div>
            <div class="form-group"><label>Options (comma-separated)</label><input type="text" id="qOptions" placeholder="e.g. Paris, London, Berlin, Madrid"></div>
            <div class="form-group"><label>Correct Answer</label><input type="text" id="qAnswer" placeholder="Must match one option exactly"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="qModalCancel">Cancel</button>
              <button type="submit" class="btn btn-gold">Save Question</button>
            </div>
          </form>
        </div></div>`;

      let editingQId = null;
      window.editQuestion = (id) => {
        const q = questions.find(x => x.id === id);
        if (!q) return;
        editingQId = id;
        document.getElementById('qModalTitle').textContent = 'Edit Question';
        document.getElementById('qText').value = q.question;
        document.getElementById('qOptions').value = (q.options || []).join(', ');
        document.getElementById('qAnswer').value = q.answer;
        document.getElementById('qModal').classList.add('open');
      };
      window.deleteQuestion = async (id) => {
        if (!confirm('Delete this question?')) return;
        try { await api('DELETE', `/challenge/questions/${id}`); toast('Question deleted'); renderChallenge(); }
        catch { toast('Failed to delete', 'error'); }
      };

      document.getElementById('addQBtn')?.addEventListener('click', () => {
        editingQId = null;
        document.getElementById('qModalTitle').textContent = 'Add Question';
        document.getElementById('qForm').reset();
        document.getElementById('qModal').classList.add('open');
      });
      document.getElementById('qModalCancel')?.addEventListener('click', () => {
        document.getElementById('qModal').classList.remove('open');
      });
      document.getElementById('qForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const options = document.getElementById('qOptions').value.split(',').map(s => s.trim()).filter(Boolean);
        const data = {
          question: document.getElementById('qText').value,
          options,
          answer: document.getElementById('qAnswer').value
        };
        try {
          if (editingQId) {
            await api('PUT', `/challenge/questions/${editingQId}`, data);
            toast('Question updated');
          } else {
            await api('POST', '/challenge/questions', data);
            toast('Question added');
          }
          document.getElementById('qModal').classList.remove('open');
          renderChallenge();
        } catch { toast('Failed to save question', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load challenge</p>'; }
  }

  // ===== GUIDANCE =====
  async function renderGuidance() {
    try {
      const settings = await api('GET', '/content/settings');
      contentArea.innerHTML = `
        <div class="table-wrap">
          <div class="table-header"><h3>Guidance Content</h3></div>
          <div style="padding:20px;">
            <p style="color:var(--text2);font-size:0.8rem;margin-bottom:16px;">This text appears in the Guidance section of the public site. Use it to welcome fans, explain how things work, or share tips.</p>
            <form id="guidanceForm">
              <div class="form-group"><label>Guidance Text</label>
                <textarea id="guidanceText" rows="8">${settings.guidance || ''}</textarea>
              </div>
              <button type="submit" class="btn btn-gold">Save Guidance</button>
            </form>
            <div id="guidanceSaved" class="success-msg"></div>
          </div>
        </div>`;

      document.getElementById('guidanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const current = await api('GET', '/content/settings');
          await api('POST', '/content/bio', {
            text: current.bio || '',
            stats: current.stats,
            guidance: document.getElementById('guidanceText').value
          });
          document.getElementById('guidanceSaved').textContent = '✓ Guidance saved!';
          toast('Guidance updated');
        } catch { toast('Failed to save guidance', 'error'); }
      });
    } catch { contentArea.innerHTML = '<p class="error-msg">Failed to load guidance</p>'; }
  }

  // ===== INIT: load default section =====
  loadSection('overview');

})();
