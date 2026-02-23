const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

// req.user = objet user complet depuis la DB (via middleware auth)
// Les champs disponibles : id, nom, prenom, email, role, service, poste

// ── GET all rooms ──────────────────────────────────────────────
exports.getRooms = (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = db.chatRooms.filter(r =>
      r.type === 'group' ||
      (r.type === 'private' && (r.user1Id === userId || r.user2Id === userId))
    );

    const result = rooms.map(room => {
      const msgs   = db.chatMessages.filter(m => m.roomId === room.id);
      const last   = msgs[msgs.length - 1] || null;
      const unread = msgs.filter(m =>
        m.senderId !== userId && !(m.readBy || []).includes(userId)
      ).length;
      return { ...room, lastMessage: last, unreadCount: unread };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getRooms error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET messages for a room ────────────────────────────────────
exports.getMessages = (req, res) => {
  try {
    const { roomId } = req.params;
    const since  = req.query.since ? Number(req.query.since) : 0;
    const userId = req.user.id;

    let msgs = db.chatMessages.filter(m => m.roomId === roomId);
    if (since > 0) msgs = msgs.filter(m => m.ts > since);

    // Marquer comme lus
    db.chatMessages.forEach(m => {
      if (m.roomId === roomId) {
        if (!m.readBy) m.readBy = [];
        if (!m.readBy.includes(userId)) m.readBy.push(userId);
      }
    });

    res.json({ success: true, data: msgs });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST envoyer un message ────────────────────────────────────
exports.sendMessage = (req, res) => {
  try {
    const { roomId, text } = req.body;
    const user = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message vide' });
    }

    const room = db.chatRooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Salon introuvable' });
    }

    const senderName = [user.prenom, user.nom].filter(Boolean).join(' ') || user.email;

    const msg = {
      id:         `msg_${uuidv4()}`,
      roomId,
      senderId:   user.id,
      senderName,
      senderRole: user.role,
      text:       text.trim(),
      ts:         Date.now(),
      readBy:     [user.id],
    };

    db.chatMessages.push(msg);

    // Garde max 500 messages par salon
    const roomMsgs = db.chatMessages.filter(m => m.roomId === roomId);
    if (roomMsgs.length > 500) {
      const toRemove = new Set(roomMsgs.slice(0, roomMsgs.length - 500).map(m => m.id));
      db.chatMessages = db.chatMessages.filter(m => !toRemove.has(m.id));
    }

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST créer une conversation privée ─────────────────────────
exports.createPrivateRoom = (req, res) => {
  try {
    const { targetUserId, targetName } = req.body;
    const userId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId requis' });
    }

    // ID déterministe pour la room privée
    const roomId   = [userId, targetUserId].sort().join('___');
    const existing = db.chatRooms.find(r => r.id === roomId);
    if (existing) return res.json({ success: true, data: existing });

    const myName = [req.user.prenom, req.user.nom].filter(Boolean).join(' ') || req.user.email;

    const room = {
      id:         roomId,
      type:       'private',
      name:       targetName || 'Conversation privée',
      user1Id:    userId,
      user2Id:    targetUserId,
      user1Name:  myName,
      user2Name:  targetName || '—',
      created_at: new Date().toISOString(),
    };

    db.chatRooms.push(room);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    console.error('createPrivateRoom error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST créer un groupe ───────────────────────────────────────
exports.createGroup = (req, res) => {
  try {
    const { name, icon, desc } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nom du groupe requis' });
    }

    const room = {
      id:         `g_${uuidv4()}`,
      type:       'group',
      name:       name.trim(),
      icon:       icon || '💬',
      desc:       (desc || '').trim(),
      createdBy:  req.user.id,
      created_at: new Date().toISOString(),
    };

    db.chatRooms.push(room);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    console.error('createGroup error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET liste des utilisateurs (pour chat privé) ───────────────
exports.getChatUsers = (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = db.users
      .filter(u => u.actif && !u.bloque && u.id !== currentUserId)
      .map(u => ({
        id:    u.id,
        name:  [u.prenom, u.nom].filter(Boolean).join(' ') || u.email,
        email: u.email,
        role:  u.role,
        poste: u.poste || u.role,
      }));

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('getChatUsers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE un message ─────────────────────────────────────────
exports.deleteMessage = (req, res) => {
  try {
    const { msgId } = req.params;
    const userId = req.user.id;

    const idx = db.chatMessages.findIndex(m => m.id === msgId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Message introuvable' });
    }

    const msg = db.chatMessages[idx];
    if (msg.senderId !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    db.chatMessages.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
