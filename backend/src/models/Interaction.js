const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interaction = sequelize.define('Interaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'author_id',
  },
  type: {
    type: DataTypes.ENUM('call', 'meeting', 'email', 'comment'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'interactions',
  underscored: true,
});

module.exports = Interaction;