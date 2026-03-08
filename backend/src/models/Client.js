const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('lead', 'client'),
    defaultValue: 'lead',
  },
  stage: {
    type: DataTypes.ENUM(
      'new',
      'negotiation',
      'proposal_sent',
      'contract_signed',
      'in_progress',
      'completed'
    ),
    defaultValue: 'new',
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING(200),
    field: 'company_name',
  },
  email: {
    type: DataTypes.STRING(150),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  telegram: {
    type: DataTypes.STRING(100),
  },
  whatsapp: {
    type: DataTypes.STRING(20),
  },
  inn: {
    type: DataTypes.STRING(12),
  },
  legalName: {
    type: DataTypes.STRING(200),
    field: 'legal_name',
  },
  legalAddress: {
    type: DataTypes.TEXT,
    field: 'legal_address',
  },
  source: {
    type: DataTypes.ENUM(
      'website',
      'referral',
      'cold_call',
      'social',
      'utm',
      'other'
    ),
  },
  utmSource: {
    type: DataTypes.STRING(100),
    field: 'utm_source',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  category: {
    type: DataTypes.STRING(50),
  },
  managerId: {
    type: DataTypes.UUID,
    field: 'manager_id',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  firstContactDate: {
    type: DataTypes.DATEONLY,
    field: 'first_contact_date',
    defaultValue: DataTypes.NOW,
  },
  stageOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'stage_order',
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'clients',
  underscored: true,
});

module.exports = Client;