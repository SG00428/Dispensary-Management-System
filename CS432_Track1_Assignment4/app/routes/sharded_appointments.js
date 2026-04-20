// ═══════════════════════════════════════════════════════════════════════════
// Shard-Aware Appointments Route
//
// - Member views own appointments  → single-shard (computed from MemberID)
// - Doctor views all patients      → fan-out to all shards, filter by DoctorID
// - Admin views everything         → fan-out to all shards
// - Date range query               → fan-out to all shards (cross-shard)
// - New booking                    → routed to MemberID's shard
// ═══════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const authModule = require('../middleware/auth');
const verifyToken = authModule.verifyToken || authModule.authenticate || authModule;
const shard = require('../config/shardRouter');

// ── GET /appointments ───────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = req.user;

    // Doctors require a JOIN with Doctor — but Doctor is replicated on every shard
    const baseSql = `
      SELECT a.*, d.Name AS DoctorName, d.Specialization
      FROM Appointment a
      JOIN Doctor d ON a.DoctorID = d.DoctorID
    `;

    // Members: their own appointments → single shard
    if (user.entityType === 'Member' &&
        !['Admin', 'SuperAdmin'].some(r => user.roles.includes(r))) {
      const memberID = user.entityID;
      const rows = await shard.queryShard(
        memberID,
        `${baseSql} WHERE a.MemberID = ? ORDER BY a.AppointmentDate DESC, a.AppointmentTime`,
        [memberID]
      );
      return res.json({
        count: rows.length,
        data: rows,
        _shard: { type: 'single-shard', shardId: shard.getShardId(memberID) }
      });
    }

    // Doctors: their patients could be on any shard → fan out
    if (user.entityType === 'Doctor' &&
        !['Admin', 'SuperAdmin'].some(r => user.roles.includes(r))) {
      const doctorID = user.entityID;
      const rows = await shard.queryAllShards(
        `${baseSql} WHERE a.DoctorID = ? ORDER BY a.AppointmentDate DESC`,
        [doctorID]
      );
      rows.sort((a, b) => new Date(b.AppointmentDate) - new Date(a.AppointmentDate));
      return res.json({
        count: rows.length,
        data: rows,
        _shard: { type: 'cross-shard fan-out', shardsQueried: shard.NUM_SHARDS }
      });
    }

    // Admin/SuperAdmin: query all shards
    const rows = await shard.queryAllShards(
      `${baseSql} ORDER BY a.AppointmentDate DESC, a.AppointmentTime`
    );
    rows.sort((a, b) => new Date(b.AppointmentDate) - new Date(a.AppointmentDate));
    return res.json({
      count: rows.length,
      data: rows,
      _shard: { type: 'cross-shard fan-out', shardsQueried: shard.NUM_SHARDS }
    });
  } catch (err) {
    console.error('Sharded GET /appointments error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /appointments/range?from=&to= ───────────────────────────────────────
// Cross-shard RANGE QUERY — required by the assignment.
router.get('/range', verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to date parameters required' });
    }

    const sql = `
      SELECT a.*, d.Name AS DoctorName
      FROM Appointment a
      JOIN Doctor d ON a.DoctorID = d.DoctorID
      WHERE a.AppointmentDate BETWEEN ? AND ?
      ORDER BY a.AppointmentDate, a.AppointmentTime
    `;

    // Use the labeled version so we can show per-shard counts
    const labeled = await shard.queryAllShardsLabeled(sql, [from, to]);
    const merged = [];
    const perShardCounts = {};
    for (const { shardId, port, rows } of labeled) {
      merged.push(...rows);
      perShardCounts[`shard_${shardId}_port_${port}`] = rows.length;
    }
    merged.sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate));

    return res.json({
      count: merged.length,
      data: merged,
      query: { from, to },
      _shard: {
        type: 'cross-shard range query',
        shardsQueried: shard.NUM_SHARDS,
        rowsPerShard: perShardCounts,
      }
    });
  } catch (err) {
    console.error('Sharded range query error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /appointments ──────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { MemberID, DoctorID, AppointmentDate, AppointmentTime,
            Symptoms, Priority } = req.body;

    if (!MemberID || !DoctorID || !AppointmentDate || !AppointmentTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert into the correct shard based on MemberID
    const result = await shard.insertIntoShard(
      MemberID,
      `INSERT INTO Appointment (MemberID, DoctorID, AppointmentDate,
        AppointmentTime, Symptoms, Priority, Status)
       VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [MemberID, DoctorID, AppointmentDate, AppointmentTime,
       Symptoms || null, Priority || 'Normal']
    );

    return res.status(201).json({
      message: 'Appointment booked',
      appointmentID: result.insertId,
      _shard: shard.getShardInfo(MemberID)
    });
  } catch (err) {
    console.error('Sharded POST /appointments error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /appointments/:id ───────────────────────────────────────────────────
// Note: To update an appointment, we need to know which shard holds it.
// We do this by looking up the MemberID via fan-out, then updating the
// correct shard. (In production, the client would pass MemberID in the body.)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const apptID = parseInt(req.params.id);
    const { Status, MemberID } = req.body;

    if (!Status) return res.status(400).json({ error: 'Status required' });

    // If MemberID is provided in the body, route directly
    if (MemberID) {
      const result = await shard.updateInShard(
        MemberID,
        'UPDATE Appointment SET Status = ? WHERE AppointmentID = ?',
        [Status, apptID]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({
        message: 'Appointment updated',
        _shard: shard.getShardInfo(MemberID)
      });
    }

    // Otherwise, fan out to find which shard owns this appointment
    const labeled = await shard.queryAllShardsLabeled(
      'SELECT MemberID FROM Appointment WHERE AppointmentID = ?',
      [apptID]
    );
    let foundShardId = -1;
    let foundMemberID = null;
    for (const { shardId, rows } of labeled) {
      if (rows.length > 0) {
        foundShardId = shardId;
        foundMemberID = rows[0].MemberID;
        break;
      }
    }

    if (foundShardId === -1) {
      return res.status(404).json({ error: 'Appointment not found on any shard' });
    }

    await shard.updateInShard(
      foundMemberID,
      'UPDATE Appointment SET Status = ? WHERE AppointmentID = ?',
      [Status, apptID]
    );

    return res.json({
      message: 'Appointment updated',
      _shard: { shardId: foundShardId, memberID: foundMemberID, lookupRequired: true }
    });
  } catch (err) {
    console.error('Sharded PUT /appointments/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
