const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.errorLogFile = path.join(this.logDir, 'error.log');
        this.infoLogFile = path.join(this.logDir, 'info.log');
        
        // Criar diretório de logs
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    formatLogEntry(level, message, data = null) {
        const entry = {
            timestamp: this.getCurrentTimestamp(),
            level: level,
            message: message
        };
        
        if (data) {
            entry.data = data;
        }
        
        return JSON.stringify(entry, null, 2) + '\n' + '-'.repeat(80) + '\n';
    }

    logError(error, context = '') {
        const errorData = {
            context: context,
            message: error.message,
            stack: error.stack,
            code: error.code || null
        };
        
        const logString = this.formatLogEntry('ERROR', error.message, errorData);
        
        try {
            fs.appendFileSync(this.errorLogFile, logString);
            console.error(`[ERRO] ${context}:`, error.message);
        } catch (err) {
            console.error('Erro ao escrever no arquivo de log:', err.message);
        }
    }

    logInfo(message, data = null) {
        const logString = this.formatLogEntry('INFO', message, data);
        
        try {
            fs.appendFileSync(this.infoLogFile, logString);
            console.log(`[INFO] ${message}`);
        } catch (err) {
            console.error('Erro ao escrever no arquivo de log:', err.message);
        }
    }

    logException(exception, operation) {
        this.logError(exception, operation);
    }

    logWarning(message, data = null) {
        const logString = this.formatLogEntry('WARNING', message, data);
        
        try {
            fs.appendFileSync(this.infoLogFile, logString);
            console.warn(`[WARNING] ${message}`);
        } catch (err) {
            console.error('Erro ao escrever no arquivo de log:', err.message);
        }
    }
}

module.exports = new Logger();
