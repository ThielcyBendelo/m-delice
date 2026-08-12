import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';

const ORGANIZATION_TYPES = [
  'admin',
  'diaspora',
  'hospital',
  'education',
  'travel_airline',
  'automobile',
];

function clean(value, maxLength) {
  const normalized = String(value || '').trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function validate(body) {
  const organizationName = clean(body.organizationName, 200);
  const organizationType = clean(body.organizationType, 40)?.toLowerCase();
  if (!organizationName) return { error: "Le nom de l'organisation est requis." };
  if (!ORGANIZATION_TYPES.includes(organizationType)) {
    return { error: "Le secteur d'activité est invalide." };
  }
  return {
    values: {
      organizationName,
      organizationType,
      registrationNumber: clean(body.registrationNumber, 100),
      contactName: clean(body.contactName, 160),
      email: clean(body.email, 255)?.toLowerCase() || null,
      phone: clean(body.phone, 40),
      country: clean(body.country, 100),
      city: clean(body.city, 100),
      address: clean(body.address, 300),
      notes: clean(body.notes, 1000),
    },
  };
}

function bindOrganization(request, values) {
  return request
    .input('OrganizationName', sql.NVarChar(200), values.organizationName)
    .input('OrganizationType', sql.NVarChar(40), values.organizationType)
    .input('RegistrationNumber', sql.NVarChar(100), values.registrationNumber)
    .input('ContactName', sql.NVarChar(160), values.contactName)
    .input('Email', sql.NVarChar(255), values.email)
    .input('Phone', sql.NVarChar(40), values.phone)
    .input('Country', sql.NVarChar(100), values.country)
    .input('City', sql.NVarChar(100), values.city)
    .input('Address', sql.NVarChar(300), values.address)
    .input('Notes', sql.NVarChar(1000), values.notes);
}

async function writeAudit(req, action, organizationId, details) {
  await auditService.log({
    actorUserId: req.user.id,
    action,
    entityType: 'partner_organization',
    entityId: organizationId,
    details,
    ipAddress: req.ip,
  });
}

const organizationController = {
  types(_req, res) {
    return res.status(200).json({ success: true, types: ORGANIZATION_TYPES });
  },

  async list(req, res) {
    try {
      const query = clean(req.query.q, 100);
      const type = clean(req.query.type, 40)?.toLowerCase();
      const includeArchived = String(req.query.includeArchived || '') === 'true';
      if (type && !ORGANIZATION_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: 'Secteur invalide.' });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Query', sql.NVarChar(102), query ? `%${query}%` : null)
        .input('Type', sql.NVarChar(40), type || null)
        .input('IncludeArchived', sql.Bit, includeArchived ? 1 : 0)
        .query(`
          SELECT OrganizationID, OrganizationName, OrganizationType, RegistrationNumber,
                 ContactName, Email, Phone, Country, City, Address, Notes,
                 IsActive, CreatedAt, UpdatedAt
          FROM PartnerOrganizations
          WHERE (@IncludeArchived = 1 OR IsActive = 1)
            AND (@Type IS NULL OR OrganizationType = @Type)
            AND (@Query IS NULL OR OrganizationName LIKE @Query OR RegistrationNumber LIKE @Query
                 OR ContactName LIKE @Query OR Email LIKE @Query OR City LIKE @Query)
          ORDER BY IsActive DESC, OrganizationName ASC
        `);
      return res.status(200).json({ success: true, organizations: result.recordset });
    } catch (error) {
      console.error('organizations.list:', error);
      return res.status(500).json({ success: false, message: 'Erreur de chargement des organisations.' });
    }
  },

  async create(req, res) {
    try {
      const validation = validate(req.body || {});
      if (validation.error) return res.status(400).json({ success: false, message: validation.error });
      const pool = await poolPromise;
      const request = bindOrganization(pool.request(), validation.values)
        .input('ActorUserID', sql.Int, Number(req.user.id));
      const result = await request.query(`
        INSERT INTO PartnerOrganizations (
          OrganizationName, OrganizationType, RegistrationNumber, ContactName, Email,
          Phone, Country, City, Address, Notes, CreatedByUserID, UpdatedByUserID
        )
        OUTPUT INSERTED.*
        VALUES (
          @OrganizationName, @OrganizationType, @RegistrationNumber, @ContactName, @Email,
          @Phone, @Country, @City, @Address, @Notes, @ActorUserID, @ActorUserID
        )
      `);
      const organization = result.recordset[0];
      await writeAudit(req, 'admin.organization_create', organization.OrganizationID, {
        name: organization.OrganizationName,
        type: organization.OrganizationType,
      });
      return res.status(201).json({ success: true, organization });
    } catch (error) {
      console.error('organizations.create:', error);
      return res.status(500).json({ success: false, message: "Erreur de création de l'organisation." });
    }
  },

  async update(req, res) {
    try {
      const organizationId = Number(req.params.id);
      const validation = validate(req.body || {});
      if (!Number.isInteger(organizationId) || organizationId < 1) {
        return res.status(400).json({ success: false, message: 'Identifiant invalide.' });
      }
      if (validation.error) return res.status(400).json({ success: false, message: validation.error });
      const pool = await poolPromise;
      const request = bindOrganization(pool.request(), validation.values)
        .input('OrganizationID', sql.Int, organizationId)
        .input('ActorUserID', sql.Int, Number(req.user.id));
      const result = await request.query(`
        UPDATE PartnerOrganizations
        SET OrganizationName = @OrganizationName, OrganizationType = @OrganizationType,
            RegistrationNumber = @RegistrationNumber, ContactName = @ContactName,
            Email = @Email, Phone = @Phone, Country = @Country, City = @City,
            Address = @Address, Notes = @Notes, UpdatedByUserID = @ActorUserID,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE OrganizationID = @OrganizationID
      `);
      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Organisation introuvable.' });
      }
      await writeAudit(req, 'admin.organization_update', organizationId, validation.values);
      return res.status(200).json({ success: true, organization: result.recordset[0] });
    } catch (error) {
      console.error('organizations.update:', error);
      return res.status(500).json({ success: false, message: "Erreur de modification de l'organisation." });
    }
  },

  async setActive(req, res) {
    try {
      const organizationId = Number(req.params.id);
      const active = req.body?.active === true;
      if (!Number.isInteger(organizationId) || organizationId < 1) {
        return res.status(400).json({ success: false, message: 'Identifiant invalide.' });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('OrganizationID', sql.Int, organizationId)
        .input('IsActive', sql.Bit, active ? 1 : 0)
        .input('ActorUserID', sql.Int, Number(req.user.id))
        .query(`
          UPDATE PartnerOrganizations
          SET IsActive = @IsActive, UpdatedByUserID = @ActorUserID, UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE OrganizationID = @OrganizationID
        `);
      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Organisation introuvable.' });
      }
      await writeAudit(req, active ? 'admin.organization_restore' : 'admin.organization_archive', organizationId, { active });
      return res.status(200).json({ success: true, organization: result.recordset[0] });
    } catch (error) {
      console.error('organizations.setActive:', error);
      return res.status(500).json({ success: false, message: "Erreur d'archivage de l'organisation." });
    }
  },
};

export default organizationController;