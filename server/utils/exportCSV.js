const { Parser } = require('json2csv');

const exportCSV = (data, fields) => {
    const parser = new Parser({ fields });
    return parser.parse(data);
};

module.exports = { exportCSV };
