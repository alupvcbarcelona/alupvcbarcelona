const DNS = require('dns');

const resolve_dns = () => {
    DNS.setServers(['8.8.8.8', '8.8.4.4']);
}

module.exports = resolve_dns;