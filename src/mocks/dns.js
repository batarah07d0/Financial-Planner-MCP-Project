// Mock untuk modul dns.js
// Ini adalah implementasi sederhana yang tidak bergantung pada modul Node.js dgram

// Fungsi-fungsi dasar DNS yang dimock
const lookup = (_hostname, options, callback) => {
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

const resolve = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, ['127.0.0.1']);
  }, 0);
};

const resolve4 = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, ['127.0.0.1']);
  }, 0);
};

const resolve6 = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, ['::1']);
  }, 0);
};

const resolveMx = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveTxt = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveSrv = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveNs = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const resolveCname = (_hostname, callback) => {
  setTimeout(() => {
    callback(null, []);
  }, 0);
};

const reverse = (_ip, callback) => {
  setTimeout(() => {
    callback(null, ['localhost']);
  }, 0);
};

// Versi Promise dari fungsi-fungsi di atas
const promises = {
  lookup: (_hostname, _options) => {
    return Promise.resolve({ address: '127.0.0.1', family: 4 });
  },
  resolve: (_hostname) => {
    return Promise.resolve(['127.0.0.1']);
  },
  resolve4: (_hostname) => {
    return Promise.resolve(['127.0.0.1']);
  },
  resolve6: (_hostname) => {
    return Promise.resolve(['::1']);
  },
  resolveMx: (_hostname) => {
    return Promise.resolve([]);
  },
  resolveTxt: (_hostname) => {
    return Promise.resolve([]);
  },
  resolveSrv: (_hostname) => {
    return Promise.resolve([]);
  },
  resolveNs: (_hostname) => {
    return Promise.resolve([]);
  },
  resolveCname: (_hostname) => {
    return Promise.resolve([]);
  },
  reverse: (_ip) => {
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
