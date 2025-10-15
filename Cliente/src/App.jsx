import React, { useState } from 'react';
import Login from './components/auth/Login';
import TodoApp from './components/tasks/TodoApp';
import './styles/styles.css';
import './styles/login.css';
import './styles/tareaEtiqueta.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <TodoApp user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;