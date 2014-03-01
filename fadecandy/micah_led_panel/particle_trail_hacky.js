#!/usr/bin/env node

// Simple particle system example with Node and opc.js
// Specify a layout file on the command line, or use the default (grid32x16z)

var OPC = new require('./opc');
var model = OPC.loadModel(process.argv[2] || '../layouts/grid32x16z.json');
var client = new OPC('192.168.2.1', 7890);

var masterIntensity = 0.2;
var masterSpeed = 0.5;

function draw() {

    var time = 0.009 * masterSpeed * new Date().getTime();
    var numParticles = 200;
    var particles = [];

    for (var i = 0; i < numParticles; i++) {
        var s = i / numParticles;

        var radius = 0.2 + 1.5 * s;
        var theta = time + 0.04 * i;
        var x = radius * Math.cos(theta);
        var y = radius * Math.sin(theta + 10.0 * Math.sin(theta * 0.15));
        var hue = time * 0.01 + s * 0.2;

        particles[i] = {
            point: [x, 0, y],
            intensity: 0.2 * masterIntensity * s,
            falloff: 60,
            color: OPC.hsv(hue, 0.5, 0.8)
        };
    }

    client.mapParticles(particles, model);
}

setInterval(draw, 10);
