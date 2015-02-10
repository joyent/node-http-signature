// Copyright 2011 Joyent, Inc.  All rights reserved.

var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
var nacl = require('tweetnacl');

var test = require('tap').test;
var uuid = require('node-uuid');

var httpSignature = require('../lib/index');



///--- Globals

var hmacKey = null;
var httpOptions = null;
var rsaPrivate = null;
var signOptions = null;
var server = null;
var socket = null;
var keypair = nacl.sign.keyPair();
var ed25519Private = nacl.util.encodeBase64(keypair.secretKey);
var ed25519Public = nacl.util.encodeBase64(keypair.publicKey);


///--- Tests


test('setup', function(t) {
  rsaPrivate = fs.readFileSync(__dirname + '/rsa_private.pem', 'ascii');
  t.ok(rsaPrivate);

  socket = '/tmp/.' + uuid();

  server = http.createServer(function(req, res) {
    res.writeHead(200);
    res.end();
  });

  server.listen(socket, function() {
    hmacKey = uuid();
    httpOptions = {
      socketPath: socket,
      path: '/',
      method: 'GET',
      headers: {}
    };

    signOptions = {
      key: rsaPrivate,
      keyId: 'unitTest'
    };

    t.end();
  });
});


test('defaults', function(t) {
  var req = http.request(httpOptions, function(res) {
    t.end();
  });
  t.ok(httpSignature.sign(req, signOptions));
  t.ok(req.getHeader('Authorization'));
  console.log('> ' + req.getHeader('Authorization'));
  req.end();
});


test('request line', function(t) {
  var req = http.request(httpOptions, function(res) {
    t.end();
  });
  var opts = {
    keyId: 'unit',
    key: rsaPrivate,
    headers: ['date', 'request-line']
  };

  t.ok(httpSignature.sign(req, opts));
  t.ok(req.getHeader('Authorization'));
  console.log('> ' + req.getHeader('Authorization'));
  req.end();
});

test('ed25519', function(t) {
  var req = http.request(httpOptions, function(res) {
    t.end();
  });
  var opts = {
    keyId: 'unit',
    key: ed25519Private,
    algorithm: 'ed25519-sha512'
  };

  t.ok(httpSignature.sign(req, opts));
  t.ok(req.getHeader('Authorization'));
  console.log('> ' + req.getHeader('Authorization'));
  req.end();
});

test('hmac', function(t) {
  var req = http.request(httpOptions, function(res) {
    t.end();
  });
  var opts = {
    keyId: 'unit',
    key: uuid(),
    algorithm: 'hmac-sha1'
  };

  t.ok(httpSignature.sign(req, opts));
  t.ok(req.getHeader('Authorization'));
  console.log('> ' + req.getHeader('Authorization'));
  req.end();
});


test('tear down', function(t) {
  server.on('close', function() {
    t.end();
  });
  server.close();
});
