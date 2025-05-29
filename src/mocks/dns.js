// Mock untuk modul dns.js
// Ini adalah implementasi sederhana yang tidak bergantung pada modul Node.js dgram

// Fungsi-fungsi dasar DNS yang dimock
const lookup = (hostname, options, callback) => {
  // Jika options adalah fungsi, itu adalah callback
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Implementasi sederhana yang selalu mengembalikan 127.0.0.1
  setTimeout(() => {
    callback(null, '127.0.0.1', 4);
  }, 0);
};

const resolve = (hostname, callback) => {
  setTimeout(() => {
    callback(null, ['127.0.0.1']);
  }, 0);
};

const resolve4 = (hostname, callback) => {
  setTimeout(() => {
    callback(null, ['127.0.0.1']);
  }, 0);
};

const resolve6 = (hostname, callback) => {
  setTimeout(() => {
    callback(null, ['::1']);
  }, 0);
};

const resolveMx = (hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveTxt = (hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveSrv = (hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveNs = (hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveCname = (hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const reverse = (ip, callback) => {
  setTimeout(() => {
    callback(null, ['localhost']);
  }, 0);
};

// Versi Promise dari fungsi-fungsi di atas
const promises = {
  lookup: (hostname, options) => {
    return Promise.resolve({ address: '127.0.0.1', family: 4 });
  },
  resolve: (hostname) => {
    return Promise.resolve(['127.0.0.1']);
  },
  resolve4: (hostname) => {
    return Promise.resolve(['127.0.0.1']);
  },
  resolve6: (hostname) => {
    return Promise.resolve(['::1']);
  },
  resolveMx: (hostname) => {
    return Promise.resolve([]);
  },
  resolveTxt: (hostname) => {
    return Promise.resolve([]);
  },
  resolveSrv: (hostname) => {
    return Promise.resolve([]);
  },
  resolveNs: (hostname) => {
    return Promise.resolve([]);
  },
  resolveCname: (hostname) => {
    return Promise.resolve([]);
  },
  reverse: (ip) => {
    return Promise.resolve(['localhost']);
  }
};

// Konstanta yang biasanya ada di modul dns
const NODATA = 'ENODATA';
const FORMERR = 'EFORMERR';
const SERVFAIL = 'ESERVFAIL';
const NOTFOUND = 'ENOTFOUND';
const NOTIMP = 'ENOTIMP';
const REFUSED = 'EREFUSED';
const BADQUERY = 'EBADQUERY';
const BADNAME = 'EBADNAME';
const BADFAMILY = 'EBADFAMILY';
const BADRESP = 'EBADRESP';
const CONNREFUSED = 'ECONNREFUSED';
const TIMEOUT = 'ETIMEOUT';
const EOF = 'EOF';
const FILE = 'EFILE';
const NOMEM = 'ENOMEM';
const DESTRUCTION = 'EDESTRUCTION';
const BADSTR = 'EBADSTR';
const BADFLAGS = 'EBADFLAGS';
const NONAME = 'ENONAME';
const BADHINTS = 'EBADHINTS';
const NOTINITIALIZED = 'ENOTINITIALIZED';
const LOADIPHLPAPI = 'ELOADIPHLPAPI';
const ADDRGETNETWORKPARAMS = 'EADDRGETNETWORKPARAMS';
const CANCELLED = 'ECANCELLED';

module.exports = {
  lookup,
  resolve,
  resolve4,
  resolve6,
  resolveMx,
  resolveTxt,
  resolveSrv,
  resolveNs,
  resolveCname,
  reverse,
  promises,
  NODATA,
  FORMERR,
  SERVFAIL,
  NOTFOUND,
  NOTIMP,
  REFUSED,
  BADQUERY,
  BADNAME,
  BADFAMILY,
  BADRESP,
  CONNREFUSED,
  TIMEOUT,
  EOF,
  FILE,
  NOMEM,
  DESTRUCTION,
  BADSTR,
  BADFLAGS,
  NONAME,
  BADHINTS,
  NOTINITIALIZED,
  LOADIPHLPAPI,
  ADDRGETNETWORKPARAMS,
  CANCELLED
};
