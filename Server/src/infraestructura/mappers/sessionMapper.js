class SessionMapper{
    constructor(Session){
        this.Session = Session;
    }
// CORREGIR RETURN ERROR
    dbToDomain(sesionBD){
     if(!sesionBD){
        return null;
     }
        return new this.Session({
            id: sesionBD.id,
            userId: sesionBD.user_id,
            refreshTokenHash: sesionBD.refresh_token_hash,
            deviceId: sesionBD.device_id,
            userAgent: sesionBD.user_agent,
            ip: sesionBD.ip,
            createdAt: sesionBD.created_at,
            expiresAt: sesionBD.expires_at,
            isActive: sesionBD.is_active,

        });
    }


}

module.exports = SessionMapper;