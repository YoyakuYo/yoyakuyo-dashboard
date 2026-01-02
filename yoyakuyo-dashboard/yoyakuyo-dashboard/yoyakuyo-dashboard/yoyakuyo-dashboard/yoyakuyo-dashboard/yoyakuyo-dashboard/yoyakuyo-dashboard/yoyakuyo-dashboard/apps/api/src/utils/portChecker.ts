import { Server } from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a port is available
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = new Server();
    
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
export async function getProcessUsingPort(port: number): Promise<number | null> {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;
    
    try {
      const { stdout } = await execAsync(command);
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
      } else {
        return parseInt(stdout.trim(), 10);
      }
    } catch {
      return null;
    }
  } catch {
    return null;
  }
  
  return null;
}

/**
 * Kill the process using a port (Windows/Linux compatible)
 */
export async function killProcessUsingPort(port: number): Promise<boolean> {
  try {
    const pid = await getProcessUsingPort(port);
    
    if (!pid) {
      return false; // No process found
    }

    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `taskkill /PID ${pid} /F`
      : `kill -9 ${pid}`;
    
    try {
      await execAsync(command);
      console.log(`✅ Killed process ${pid} using port ${port}`);
      return true;
    } catch (error: any) {
      // Process might have already exited or we don't have permission
      console.warn(`⚠️  Could not kill process ${pid}: ${error.message}`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Error killing process on port ${port}:`, error.message);
    return false;
  }
}

/**
 * Get all process IDs using a port (for cases with multiple processes)
 */
export async function getAllProcessesUsingPort(port: number): Promise<number[]> {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;
    
    try {
      const { stdout } = await execAsync(command);
      const pids: number[] = [];
      
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
      } else {
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
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}

/**
 * Kill all processes using a port
 */
export async function killAllProcessesUsingPort(port: number): Promise<boolean> {
  try {
    const pids = await getAllProcessesUsingPort(port);
    
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
        await execAsync(command);
        console.log(`✅ Killed process ${pid} using port ${port}`);
      } catch (error: any) {
        console.warn(`⚠️  Could not kill process ${pid}: ${error.message}`);
        allKilled = false;
      }
    }

    return allKilled;
  } catch (error: any) {
    console.error(`❌ Error killing processes on port ${port}:`, error.message);
    return false;
  }
}

