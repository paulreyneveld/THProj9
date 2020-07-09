'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
  Course.init({
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: Sequelize.INTEGER, 
    title: { 
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Name is required"
        }
      },
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false, 
      validate: {
        notEmpty: {
          msg: "Description is required"
        }
      },
    },
    estimatedTime: Sequelize.STRING,
    materialsNeeded: Sequelize.STRING
  }, { sequelize });

  Course.associate = (models) => {
    Course.belongsTo(models.User, { 
        foreignKey: {
            fieldName: 'userId',
            allowNull: false,
        },
    });
  };

  return Course;
};