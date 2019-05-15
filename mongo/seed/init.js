// ***** Mongodb Entrypoint, Creating Application User and DB *****

db = db.getSiblingDB('admin')
db.auth('dbadmin', 'CoffeeTea123')

db.createUser({
    user: 'dbexpress',
    pwd: 'CoffeeTea123',
    roles: [{
        role: 'dbOwner',
        db: 'docker'
    }, 
    {
        role: 'readWrite',
        db: 'docker'
    }]
});