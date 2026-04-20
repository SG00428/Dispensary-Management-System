// ═══════════════════════════════════════════════════════════════════════════
// Shard-Aware Members Route
//
// Routes member queries to the correct PHYSICAL shard server.
// - Single-member operations → one shard (computed from MemberID)
// - Admin queries           → fan out to all 3 shards in parallel
// ═══════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
// Try multiple import patterns for the auth middleware
const authModule = require('../middleware/auth');
const verifyToken = authModule.verifyToken || authModule.authenticate || authModule;
const shard = require('../config/shardRouter');

// ── GET /members ────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = req.user;

    // Members see only their own record → single-shard query
    if (['Student', 'Faculty', 'Staff'].includes(user.entityType) &&
        !['Admin', 'SuperAdmin'].some(r => user.roles.includes(r))) {
      const memberID = user.entityID;
      const rows = await shard.queryShard(
        memberID,
        'SELECT * FROM Member WHERE MemberID = ?',
        [memberID]
      );
      return res.json({
        count: rows.length,
        data: rows,
        _shard: { type: 'single-shard', shardId: shard.getShardId(memberID) }
      });
    }

    // Admin/SuperAdmin → fan out to all 3 shards in parallel
    const rows = await shard.queryAllShards('SELECT * FROM Member ORDER BY MemberID');
    rows.sort((a, b) => a.MemberID - b.MemberID);

    return res.json({
      count: rows.length,
      data: rows,
      _shard: { type: 'cross-shard fan-out', shardsQueried: shard.NUM_SHARDS }
    });
  } catch (err) {
    console.error('Sharded GET /members error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /members/:id ────────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const memberID = parseInt(req.params.id);
    if (isNaN(memberID)) return res.status(400).json({ error: 'Invalid ID' });

    const rows = await shard.queryShard(
      memberID,
      'SELECT * FROM Member WHERE MemberID = ?',
      [memberID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.json({
      data: rows[0],
      _shard: shard.getShardInfo(memberID)
    });
  } catch (err) {
    console.error('Sharded GET /members/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /members ───────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { MemberID, Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
            Department, BloodGroup, EmergencyContact, Address,
            RegistrationDate, MemberType, Status } = req.body;

    if (!MemberID || !Name || !MemberType || !RegistrationDate) {
      return res.status(400).json({ error: 'MemberID, Name, MemberType, RegistrationDate required' });
    }

    // Determine shard from MemberID and insert there
    const result = await shard.insertIntoShard(
      MemberID,
      `INSERT INTO Member (MemberID, Name, Age, Email, ContactNumber,
        RollNumberOrEmployeeCode, Department, BloodGroup, EmergencyContact,
        Address, RegistrationDate, MemberType, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [MemberID, Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
       Department, BloodGroup, EmergencyContact, Address,
       RegistrationDate, MemberType, Status || 'Active']
    );

    return res.status(201).json({
      message: 'Member created',
      memberID: MemberID,
      _shard: shard.getShardInfo(MemberID)
    });
  } catch (err) {
    console.error('Sharded POST /members error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /members/:id ────────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const memberID = parseInt(req.params.id);
    const allowed = ['Name', 'Age', 'Email', 'ContactNumber', 'Department',
                     'BloodGroup', 'EmergencyContact', 'Address', 'Status'];
    const setClauses = [];
    const values = [];

    for (const [key, val] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    values.push(memberID);

    const result = await shard.updateInShard(
      memberID,
      `UPDATE Member SET ${setClauses.join(', ')} WHERE MemberID = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.json({
      message: 'Member updated',
      _shard: shard.getShardInfo(memberID)
    });
  } catch (err) {
    console.error('Sharded PUT /members/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── DELETE /members/:id ─────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const memberID = parseInt(req.params.id);

    const result = await shard.deleteFromShard(
      memberID,
      'DELETE FROM Member WHERE MemberID = ?',
      [memberID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.json({
      message: 'Member deleted',
      _shard: shard.getShardInfo(memberID)
    });
  } catch (err) {
    console.error('Sharded DELETE /members/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
