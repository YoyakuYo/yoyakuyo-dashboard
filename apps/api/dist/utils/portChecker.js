"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPortAvailable = isPortAvailable;
exports.getProcessUsingPort = getProcessUsingPort;
exports.killProcessUsingPort = killProcessUsingPort;
exports.getAllProcessesUsingPort = getAllProcessesUsingPort;
exports.killAllProcessesUsingPort = killAllProcessesUsingPort;
const net_1 = require("net");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Check if a port is available
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = new net_1.Server();
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        server.on('error', () => resolve(false));
    });
}
/**
 * Get the process ID using a port (Windows/Linux compatible)
 */
function getProcessUsingPort(port) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isWindows = process.platform === 'win32';
            const command = isWindows
                ? `netstat -ano | findstr :${port}`
                : `lsof -ti:${port}`;
            try {
                const { stdout } = yield execAsync(command);
                if (isWindows) {
                    // Parse Windows netstat output: TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    18400
                    const lines = stdout.trim().split('\n');
                    for (const line of lines) {
                        if (line.includes('LISTENING')) {
                            const parts = line.trim().split(/\s+/);
                            const pid = parts[parts.length - 1];
                            return parseInt(pid, 10);
                        }
                    }
                }
                else {
                    return parseInt(stdout.trim(), 10);
                }
            }
            catch (_a) {
                return null;
            }
        }
        catch (_b) {
            return null;
        }
        return null;
    });
}
/**
 * Kill the process using a port (Windows/Linux compatible)
 */
function killProcessUsingPort(port) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pid = yield getProcessUsingPort(port);
            if (!pid) {
                return false; // No process found
            }
            const isWindows = process.platform === 'win32';
            const command = isWindows
                ? `taskkill /PID ${pid} /F`
                : `kill -9 ${pid}`;
            try {
                yield execAsync(command);
                console.log(`✅ Killed process ${pid} using port ${port}`);
                return true;
            }
            catch (error) {
                // Process might have already exited or we don't have permission
                console.warn(`⚠️  Could not kill process ${pid}: ${error.message}`);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ Error killing process on port ${port}:`, error.message);
            return false;
        }
    });
}
/**
 * Get all process IDs using a port (for cases with multiple processes)
 */
function getAllProcessesUsingPort(port) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isWindows = process.platform === 'win32';
            const command = isWindows
                ? `netstat -ano | findstr :${port}`
                : `lsof -ti:${port}`;
            try {
                const { stdout } = yield execAsync(command);
                const pids = [];
                if (isWindows) {
                    // Parse Windows netstat output
                    const lines = stdout.trim().split('\n');
                    for (const line of lines) {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length > 0) {
                            const pid = parseInt(parts[parts.length - 1], 10);
                            if (!isNaN(pid) && pid > 0 && !pids.includes(pid)) {
                                pids.push(pid);
                            }
                        }
                    }
                }
                else {
                    // Linux/Mac: lsof returns space-separated PIDs
                    const pidList = stdout.trim().split(/\s+/).filter(Boolean);
                    for (const pidStr of pidList) {
                        const pid = parseInt(pidStr, 10);
                        if (!isNaN(pid) && pid > 0) {
                            pids.push(pid);
                        }
                    }
                }
                return pids;
            }
            catch (_a) {
                return [];
            }
        }
        catch (_b) {
            return [];
        }
    });
}
/**
 * Kill all processes using a port
 */
function killAllProcessesUsingPort(port) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pids = yield getAllProcessesUsingPort(port);
            if (pids.length === 0) {
                return false; // No processes found
            }
            const isWindows = process.platform === 'win32';
            let allKilled = true;
            for (const pid of pids) {
                const command = isWindows
                    ? `taskkill /PID ${pid} /F`
                    : `kill -9 ${pid}`;
                try {
                    yield execAsync(command);
                    console.log(`✅ Killed process ${pid} using port ${port}`);
                }
                catch (error) {
                    console.warn(`⚠️  Could not kill process ${pid}: ${error.message}`);
                    allKilled = false;
                }
            }
            return allKilled;
        }
        catch (error) {
            console.error(`❌ Error killing processes on port ${port}:`, error.message);
            return false;
        }
    });
}
