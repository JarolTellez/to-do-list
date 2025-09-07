//const { use } = require('react');

class Session{
    constructor({id=null, userId, refreshTokenHash, deviceId, userAgent, ip, createdAt, expiresAt, isActive }){
        this.id=id;
        this.userId=userId;
        this.refreshTokenHash=refreshTokenHash;
        this.deviceId=deviceId;
        this.userAgent=userAgent;
        this.ip=ip;
        this.createdAt=createdAt;
        this.expiresAt=expiresAt;
        this.isActive=isActive||true;
    }

    validate(){
        
    }

}
module.exports = Session;