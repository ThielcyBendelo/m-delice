import sql from 'mssql';

// 🟢 CONFIGURATION ADAPTATIVE : Contournement des erreurs TCP/IP Windows
const dbConfig = {
    user: 'sa',
    password: 'bendelo1996$$$$$',
    server: 'localhost',                  // Indique la machine locale
    database: 'DrcAssurancesDB',
    options: {
        instanceName: 'SQLEXPRESS',       // force l'aiguillage direct vers votre instance SQLEXPRESS
        encrypt: false,                   // Désactivé en local
        trustServerCertificate: true,     // Confiance locale
        enableArithAbort: true,
        connectTimeout: 30000             // Augmente le délai d'attente pour éviter le timeout
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('🛡️  Connexion établie avec succès avec Microsoft SQL Server Studio (SSMS)');
        return pool;
    })
    .catch(err => {
        console.error('❌ Échec de connexion. Tentative de reconnexion via le canal Named Pipes alternatif...');
        
        // 🟡 CANAL DE SECOURS : Si localhost échoue, on tente la liaison de mémoire brute par point d'accès direct
        const backupConfig = { ...dbConfig, server: '127.0.0.1\\SQLEXPRESS' };
        delete backupConfig.options.instanceName;
        
        return new sql.ConnectionPool(backupConfig).connect()
            .then(pool => {
                console.log('🛡️  Connexion établie avec succès via le canal Named Pipes de secours !');
                return pool;
            })
            .catch(finalErr => {
                console.error('❌ Échec critique de connexion à la base de données DrcAssurancesDB :', finalErr);
                process.exit(1);
            });
    });

export { sql, poolPromise };
