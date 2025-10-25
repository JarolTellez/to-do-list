import React, { useEffect } from "react";
import { useSessions } from "../../../hooks/useSessions";

const SessionsTab = ({
  onCloseAllSessions,
}) => {
  const { sessions, loading, error, loadSessions } = useSessions();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatUserAgent = (userAgent) => {
    if (!userAgent) return "Desconocido";

    const ua = userAgent.toLowerCase();

    if (ua.includes("postman")) return "Postman";
    if (ua.includes("insomnia")) return "Insomnia";
    if (ua.includes("thunder client")) return "Thunder Client";

    let browser = "Navegador";
    if (ua.includes("edg/")) browser = "Microsoft Edge";
    else if (ua.includes("chrome") && !ua.includes("edg"))
      browser = "Google Chrome";
    else if (ua.includes("firefox")) browser = "Mozilla Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome"))
      browser = "Safari";
    else if (ua.includes("opera")) browser = "Opera";

    let os = "Sistema desconocido";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

    let device = "PC";
    if (ua.includes("mobile")) device = "Móvil";
    else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";
    else if (ua.includes("android") && !ua.includes("mobile"))
      device = "Tablet Android";
    else if (ua.includes("iphone")) device = "iPhone";

    return `${browser} • ${os} • ${device}`;
  };

  return (
    <div className="user-tab-content">
      <div className="user-sessions-header">
        <h3>Sesiones Activas</h3>
        <button
          className="user-btn-danger user-btn-sm"
          onClick={onCloseAllSessions}
          disabled={loading || sessions.length <= 1}
        >
          {loading ? "Cerrando..." : "Cerrar Todas las Sesiones"}
        </button>
      </div>

      {loading ? (
        <div className="user-loading">Cargando sesiones...</div>
      ) : (
        <div className="user-sessions-list">
          {sessions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6c757d" }}>
              No hay sesiones activas
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`user-session-item ${
                  session.isCurrent ? "current" : ""
                }`}
              >
                <div className="user-session-info">
                  <div className="user-session-platform">
                    {formatUserAgent(session.userAgent)}
                    {session.isCurrent && (
                      <span className="user-current-badge">Actual</span>
                    )}
                  </div>
                  <div className="user-session-details">
                    <div>
                      <strong>IP:</strong>{" "}
                      {session.ip === "::1" ? "Localhost" : session.ip}
                    </div>
                    <div>
                      <strong>Creada:</strong> {formatDate(session.createdAt)}
                    </div>
                    <div>
                      <strong>Expira:</strong> {formatDate(session.expiresAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SessionsTab;