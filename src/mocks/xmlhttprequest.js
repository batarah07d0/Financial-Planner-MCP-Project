/**
 * Mock untuk xmlhttprequest
 * 
 * Ini adalah file mock sederhana yang mengembalikan XMLHttpRequest native
 * dari lingkungan React Native, yang sudah tersedia secara default.
 */

// Gunakan XMLHttpRequest native dari React Native
const XMLHttpRequest = global.XMLHttpRequest || {};

// Ekspor objek yang sama dengan modul xmlhttprequest
module.exports = {
  XMLHttpRequest
};
