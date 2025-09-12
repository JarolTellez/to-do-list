class SessionMapper{
    constructor(Session){
        this.Session = Session;
    }
// CORREGIR RETURN ERROR
    dbToDomain(row){
     if(!row){
        return null;
     }
        return new this.Session({
            id: row.id,
            userId: row.user_id,
            refreshTokenHash: row.refresh_token_hash,
            deviceId: row.device_id,
            userAgent: row.user_agent,
            ip: row.ip,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            isActive: row.is_active,

        });
    }


}

module.exports = SessionMapper;