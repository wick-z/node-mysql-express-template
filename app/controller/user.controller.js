const {sql_operation, getConnection, batchWithTransaction} = require('../config/database');
const {Request, Response} = require('express');

const UserService = {
    /**
     * @description 获取用户列表
     * @param {Request} request 
     * @param {Response} response 
     */
    getUsers: (request, response) => {
        sql_operation('select * from user').then(result => {
            response.send(result.results);
        }).catch(error => {
            response.send('failed');
        })
    },
    /**
     * @description 批量添加用户
     * @param {Request} request 
     * @param {Response} response 
     */
    batchAddUser: (request, response) => {
        const mock_data = [['joseph2', 'Guangzhou'], ['Tom2']];
        const sql = 'insert into user(name, address) values ?';
        getConnection().then(connection => {
            batchWithTransaction(connection, sql, {params: mock_data, size: 1}).then(() => {
                response.send('success');
            }).catch(error => {
                log(error);
                response.send('failed to perform this operation');
            })
        }).catch(error => {
            log(error);
            response.send('internal server error');
        })
    },
}

/**
 * 
 * @param {MysqlError} error 
 */
const log = (error) => {
    console.log(error.code);  // MySQL错误提示文案
    console.log(error.errno); // MySQL错误提示码
    console.log(error.sql); // MySQL执行的sql语句
    console.log(error.sqlMessage); // MySQL错误语句提示
}

module.exports = {
    UserService
}