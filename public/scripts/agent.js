'use strict';

const os = require('os');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const config = { agentToken: '', backendUrl: '', metricInterval: 30000, pollInterval: 10000 };

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-t' || args[i] === '--token') config.agentToken = args[++i];
    if (args[i] === '-u' || args[i] === '--url') config.backendUrl = args[++i];
}

if (!config.agentToken || !config.backendUrl) {
    console.error('Usage: node agent.js -t <token> -u <backendUrl>');
    process.exit(1);
}

console.log(`[Agent] Started | Token: ${config.agentToken} | Backend: ${config.backendUrl}`);


let prevCpuTimes = null;

function getCpuTimes() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    return { user, nice, sys, idle, irq };
}

function getCpuUsagePercent() {
    const current = getCpuTimes();
    if (!prevCpuTimes) {
        prevCpuTimes = current;
        return 0;
    }
    const prev = prevCpuTimes;
    const idleDiff = current.idle - prev.idle;
    const totalDiff = (current.user + current.nice + current.sys + current.idle + current.irq)
        - (prev.user + prev.nice + prev.sys + prev.idle + prev.irq);
    prevCpuTimes = current;
    if (totalDiff === 0) return 0;
    return Math.min(100, Math.max(0, parseFloat(((1 - idleDiff / totalDiff) * 100).toFixed(2))));
}

function getRamUsagePercent() {
    const total = os.totalmem();
    const free = os.freemem();
    return Math.min(100, Math.max(0, parseFloat(((1 - free / total) * 100).toFixed(2))));
}

function getDiskUsagePercent() {
    try {
        const platform = os.platform();
        if (platform === 'win32') {
            // Windows - Mock for local testing
            return 45.0;
        }
        // Linux/macOS - Read from df
        const output = execSync("df / --output=pcent 2>/dev/null | tail -1").toString().trim();
        return Math.min(100, Math.max(0, parseFloat(output.replace('%', ''))));
    } catch (err) {
        return 0;
    }
}

function getNetworkBytes() {
    try {
        if (os.platform() === 'win32') return { networkIn: 0, networkOut: 0 };
        const output = execSync("cat /proc/net/dev 2>/dev/null").toString();
        let networkIn = 0, networkOut = 0;
        for (const line of output.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('Inter') || trimmed.startsWith('face') || trimmed.startsWith('lo:')) continue;
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 10) {
                networkIn += parseInt(parts[1]) || 0;
                networkOut += parseInt(parts[9]) || 0;
            }
        }
        return { networkIn, networkOut };
    } catch (err) {
        return { networkIn: 0, networkOut: 0 };
    }
}

// ==================== HTTP Helper ====================

function request(method, urlStr, headers, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const client = url.protocol === 'https:' ? https : http;
        const bodyStr = body ? JSON.stringify(body) : '';
        const options = {
            method,
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'x-agent-token': config.agentToken,
                ...headers,
            },
        };
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// ==================== Core Logic ====================

async function pushMetrics() {
    const { networkIn, networkOut } = getNetworkBytes();
    const payload = {
        cpuUsage: getCpuUsagePercent(),
        ramUsage: getRamUsagePercent(),
        diskUsage: getDiskUsagePercent(),
        networkIn,
        networkOut,
    };
    try {
        const res = await request('POST', `${config.backendUrl}/api/metrics/push`, {}, payload);
        if (res.status === 201) {
            console.log(`[Agent] Metrics pushed | CPU: ${payload.cpuUsage}% | RAM: ${payload.ramUsage}% | Disk: ${payload.diskUsage}%`);
        } else {
            console.error(`[Agent] Failed to push metrics: ${res.status} | ${res.body}`);
        }
    } catch (err) {
        console.error(`[Agent] Network error pushing metrics to ${config.backendUrl}: ${err.message}`);
    }
}

async function pollCommands() {
    try {
        const res = await request('GET', `${config.backendUrl}/api/commands/agent/poll`, {}, null);
        if (res.status === 200 && res.body && res.body !== 'null') {
            const command = JSON.parse(res.body);
            if (command && command.data && command.data.id) {
                await executeCommand(command.data);
            }
        }
    } catch (err) {
        console.error(`[Agent] Network error polling commands from ${config.backendUrl}: ${err.message}`);
    }
}

async function executeCommand(command) {
    console.log(`[Agent] Executing command [${command.id}]: ${command.commandType} - ${command.payload}`);
    let resultLog = '';
    let status = 'SUCCESS';
    try {
        resultLog = execSync(command.payload, { timeout: 30000 }).toString();
    } catch (err) {
        resultLog = err.stderr ? err.stderr.toString() : err.message;
        status = 'FAILED';
    }
    try {
        await request('PUT', `${config.backendUrl}/api/commands/agent/${command.id}/result`, {}, { status, resultLog });
        console.log(`[Agent] Command [${command.id}] result submitted: ${status}`);
    } catch (err) {
        console.error(`[Agent] Failed to submit command result to ${config.backendUrl}: ${err.message}`);
    }
}

// ==================== Start ====================

// Initial CPU sample (warm up)
getCpuUsagePercent();

// Push immediately once after 2s warmup, then every 30s
setTimeout(() => {
    pushMetrics();
    setInterval(pushMetrics, config.metricInterval);
}, 2000);

setInterval(pollCommands, config.pollInterval);
