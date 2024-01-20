const mysql = require('mysql');
const pool = mysql.createPool({
    host: '192.168.1.50',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'mybase',
    charset: 'utf8mb4',
    timezone: 'Asia/Shanghai',
    connectionLimit: 10,
    connectTimeout: 30000,
})
mysql.tran

pool.on('release', function (connection) {
    console.log('Connection %d released', connection.threadId);
});
pool.on('connection', function (connection) {
    console.log('Connection %d connected', connection.threadId);
});

  /**
 * sql操作
 * 
 * @param {String} sql sql语句
 * @param {Object} options - 参数对象
 * @param {Array}  options.enable_transaction - 是否开启事务，默认不开启
 * @param {Number} options.params - sql占位符数据
 * @returns Promise
 */
module.exports.sql_operation = (sql, options={enable_transaction: 0, params: []}) => {
    console.log(options);
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) reject(error);

            if (options.enable_transaction) {
                connection.beginTransaction((error) => {
                    if (error) {
                        return connection.rollback(function() {
                          connection.release();
                          return reject(error);
                        });
                    }

                    connection.query(sql, options.params, (error, results, fields) => {
                        if (error) {
                            return connection.rollback(function() {
                                connection.release();
                                return reject(error);
                            });
                        }

                        connection.commit(function(error) {
                            if (error) {
                                    return connection.rollback(function() {
                                        connection.release();
                                        return reject(error);
                                    });
                            }
                        });
                        connection.release();
                        return resolve(results, fields);
                    })
                })
            } else {
                connection.query(sql, options.params, (error, results, fields) => {
                    connection.release();
            
                    if (error) reject(error);
    
                    return resolve({results, fields});
                })
            }
        })
    })
}

module.exports.getConnection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) reject(error);

            return resolve(connection);
        })
    })
}

/**
 * 带事务的批量操作
 * 
 * @param {mysql.Connection} connection 池化连接
 * @param {Object} options - 参数对象
 * @param {Array} options.params - sql的占位符数据
 * @param {Number} options.size - 分批数量
 * @returns Promise
 */
module.exports.batchWithTransaction = (connection, sql, options={params: [], size: 30}) => {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(async (error) => {
            if (error) {
                return connection.rollback(function() {
                  connection.release();
                  return reject(error);
                });
            }
    
            if (options.params.length) {
                while(options.params.length > 0) {
                    const data = options.params.splice(0, options.size);
                    try {
                        // 再包一层Promise
                        await new Promise((resolve, reject) => {
                            connection.query(sql, [data], (error, results, fields) => {
                                if (error) {
                                    return connection.rollback(function() {
                                        return reject(error);
                                    });
                                }
                                return resolve();
                            });
                        })
                    } catch (error) {
                        connection.release();
                        return reject(error);
                    }
                }

                connection.commit(function(error) {
                    if (error) {
                        return connection.rollback(function() {
                            connection.release();
                            return reject(error);
                        });
                    }
                });
                connection.release();
                return resolve();
            } else {
                try {
                    const results = await new Promise((resolve, reject) => {
                        connection.query(sql, options.params, (error, results, fields) => {
                            if (error) {
                                return connection.rollback(function() {
                                    connection.release();
                                    return reject(error);
                                });
                            }

                            return resolve({results, fields});
                        });
                    });

                    connection.commit(function(error) {
                        if (error) {
                            return connection.rollback(function() {
                                connection.release();
                                return reject(error);
                            });
                        }
                    });
                    connection.release();
                    return resolve(results);
                } catch (error) {
                    return reject(error);
                }
            }
        })
    })
}


